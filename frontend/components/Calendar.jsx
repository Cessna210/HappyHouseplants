import React from 'react';
import { Calendar } from 'react-native-calendars';
import {
  View,
  Text,
  Alert,
  Switch,
} from 'react-native';
import {
  Layout, Button, Input, ListItem,
} from '@ui-kitten/components';
import { Icon } from 'react-native-elements';
import { ScrollView } from 'react-native-gesture-handler';
import { SERVER_ADDR } from '../server';

const {
  getCalendarTheme,
  getCalendarThemeDark,
  calendarThemeDark,
  calendarThemeLight,
} = require('./CalendarTheme');

const { authFetch } = require('../auth');

const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);

/* Saves a single note to the server.
 * @param { when } The Calendar-formatted string of the date. Example: 2020-10-29 (Oct 29, 2020).
 * @param { text } The text of the note to store.
 * @return { Promise } A Promise that resolves to nothing when the note is successfully saved. */
function saveNote(when, text) {
  return authFetch(`${SERVER_ADDR}/mycalendar/notes`, 'POST', { [when]: text });
}

/* Gets a dictionary-form object of all notes that are stored
 * on the server for the current user.
 * @return { Promise } A Promise that resolves to a dictionary-form object
 * with all notes for the user. The keys are the Calendar-form dates associated
 * with each note, and the values are string arrays of each note per day.
 * For example:
 * {
 *   '2020-10-28': ['My first ever note on Oct 28, 2020'],
 *   '2020-10-29': ['My note on Oct 29, 2020', 'My second note on this day'],
 * } */
function getNotes() {
  return new Promise((resolve) => {
    authFetch(`${SERVER_ADDR}/mycalendar/notes`)
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      });
  });
}

class CalendarView extends React.Component {
  constructor() {
    super();
    this.state = {
      notes: {},
      selectedDate: null,
      tempNote: '',
      showInputView: false,
      toggleTheme: false,
    };

    this.updateNotes = () => {
      getNotes().then((downloadedNotes) => { this.setState({ notes: downloadedNotes }); })
        .catch((error) => {
          Alert.alert(
            'Network Error',
            'An error occured while trying to fetch calendar notes',
            [
              { text: 'OK', onPress: () => console.log('OK Pressed') },
            ],
          );
          console.error(`Error while fetching calendar notes: ${error}`);
        });
    };
  }

  componentDidMount() {
    this.updateNotes();
  }

  /**
   * Gets a dictionary-form object to pass into the Calendar component, which causes
   * a dot to be rendered on each day with a note, and highlights the current selected
   * day.
   * @return { Object } - A dictionary-form object. Each key is a Calendar-form date, and
   * each value has the following structure { selected: true, marked: true }. The
   * selected property will only be true for the key that is equal to this.state.selectedDate.
   * The marked property will be true for all dates that have at least one note.
   */
  getCalendarMarkInfo() {
    const { notes, selectedDate } = this.state;
    const dates = Object.keys(notes);
    const notesPerDate = Object.values(notes);
    const ret = {};
    for (let i = 0; i < dates.length; i += 1) {
      const curDate = dates[i];
      const curNotes = notesPerDate[i];
      if (curNotes.length > 0) {
        ret[curDate] = { marked: true };
      }
    }

    if (ret[selectedDate]) {
      ret[selectedDate].selected = true;
    } else {
      ret[selectedDate] = { selected: true };
    }

    return ret;
  }

  render() {
    const {
      notes, tempNote, selectedDate, showInputView, toggleTheme,
    } = this.state;
    // For each property in notes (key is date, value is array of notes), create a ListItem
    const noteViews = [];
    const dates = Object.keys(notes);
    const notesPerDate = Object.values(notes);
    for (let i = 0; i < notesPerDate.length; i += 1) {
      const curDate = dates[i];
      const notesOnThisDate = notesPerDate[i];
      const notesStr = notesOnThisDate.join('\n');
      noteViews.push(
        <ListItem
          style={toggleTheme ? getCalendarThemeDark('listItem') : getCalendarTheme('listItem')}
          title={curDate}
          description={notesStr}
          key={curDate}
        />,
      );
    }

    if (showInputView) {
      return (
        <Layout style={{ flex: 1, alignItems: 'center' }}>
          <Text />
          <Input
            style={{ width: '80%' }}
            placeholder="Enter note here"
            value={tempNote || ''}
            onChangeText={(newNote) => this.setState({ tempNote: newNote })}
          />
          <Text />
          <Button
            style={{
              width: '80%',
            }}
            status="primary"
            onPress={() => {
              if (tempNote !== '') {
                saveNote(selectedDate, tempNote).then(() => {
                  this.setState({ showInputView: false });
                  this.updateNotes();
                }).catch((error) => {
                  Alert.alert(
                    'Internal Error',
                    'An issue occured while trying to save the note',
                    [
                      { text: 'OK', onPress: () => console.log('OK Pressed') },
                    ],
                  );
                  console.error(`Error while trying to save a note: ${error}`);
                });
              } else {
                Alert.alert(
                  'Error',
                  'A blank note can not be saved',
                  [
                    { text: 'OK', onPress: () => console.log('OK Pressed') },
                  ],
                );
              }
            }}
          >
            Submit
          </Button>
          <Text />
          <Button style={{ width: '80%' }} status="primary" onPress={() => { this.setState({ showInputView: false }); }}>
            Cancel
          </Button>
        </Layout>
      );
    }
    return (
      <>
        <View style={toggleTheme ? getCalendarThemeDark('toggleWrapper') : getCalendarTheme('toggleWrapper')}>
          <Icon name="moon-o" type="font-awesome" color={toggleTheme ? 'white' : 'green'} />
          <Switch
            trackColor={{ true: 'white', false: '#BFEC70' }}
            thumbColor={toggleTheme ? 'gray' : '#5BA611'}
            value={toggleTheme}
            onValueChange={(value) => {
              console.log(`Toggle theme: ${value}`);
              this.setState({ toggleTheme: value });
            }}
          />
        </View>
        <View style={toggleTheme ? getCalendarThemeDark('calendarWrapper1') : getCalendarTheme('calendarWrapper1')}>
          <View style={{ alignContent: 'center' }}>
            <Calendar
              style={toggleTheme ? getCalendarThemeDark('calendar') : getCalendarTheme('calendar')}
              // TODO: currently only the else theme is being rendered on state changes
              // toggleTheme is working correctly
              theme={toggleTheme ? calendarThemeDark : calendarThemeLight}
              markedDates={
                this.getCalendarMarkInfo(notes)
              }
              current={new Date()}
              minDate={firstDayOfYear}
              onDayPress={(day) => {
                this.setState({ selectedDate: day.dateString });
                Alert.alert(
                  day.dateString,
                  'Save note for this date?',
                  [
                    {
                      text: 'Cancel',
                      onPress: () => {
                        this.setState({ showInputView: false });
                      },
                    },
                    {
                      text: 'Yes',
                      onPress: () => {
                        this.setState({ showInputView: true });
                      },
                    },
                  ],
                );
              }}
              onDayLongPress={(day) => {
                this.setState({ selectedDate: day.dateString, showInputView: true, tempNote: '' });
              }}
              monthFormat="MMMM yyyy"
              onMonthChange={(month) => {
                console.log('month changed', month);
              }}
              hideArrows={false}
              hideExtraDays={false}
              disableMonthChange
              firstDay={0}
              enableSwipeMonths
              showSixWeeks
            />
          </View>
          <View style={toggleTheme ? getCalendarThemeDark('noteHeader') : getCalendarTheme('noteHeader')}>
            <Text style={toggleTheme ? getCalendarThemeDark('noteHeaderText') : getCalendarTheme('noteHeaderText')}> Calendar Notes </Text>
          </View>
          <ScrollView
            contentContainerStyle={
                toggleTheme ? getCalendarThemeDark('scrollView') : getCalendarTheme('scrollView')
              }
          >
            {noteViews}
          </ScrollView>
        </View>
      </>
    );
  }
}

export default CalendarView;
