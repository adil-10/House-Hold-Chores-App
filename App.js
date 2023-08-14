import React, { Component } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import firebase from './config';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import Login from './src/Login';
import SignUp from './src/Signup';
import HomePage from './src/HomePage';
import Profile from './src/Profile';
import CreateRoom from './src/CreateRoom';
import SearchUser from './src/SearchUser';
import JoinRoom from './src/JoinRoom';
import JoinRoomByName from './src/JoinRoomByName';
import AssignChore from './src/AssignChore';
import ViewAllChores from './src/ViewAllChores';
import ShoppingList from './src/ShoppingList';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTab = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name='HomePage' component={HomePage} options={{ headerShown: false }} />
      <Tab.Screen name='ShoppingList' component={ShoppingList} options={{ headerShown: false }} />
      <Tab.Screen name='Profile' component={Profile} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      initialising: true,
      user: null
    };
  }

  componentDidMount() {
    this.authSubscriber = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        user: user,
        initialising: false
      });
    });
  }

  componentWillUnmount() {
    this.authSubscriber();
  }

  render() {
    const { initialising, user } = this.state;

    if (initialising) {
      return null;
    }

    if (!user) {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName='Login'>
            <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
            <Stack.Screen name='SignUp' component={SignUp} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    } else if (user && this.state.registered) {
      // Redirect user to Login screen after successful registration
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName='Login'>
            <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
            <Stack.Screen name='SignUp' component={SignUp} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    } else {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName='HomeTab'>
            <Stack.Screen name='HomeTab' component={HomeTab} options={{ headerShown: false }} />
            <Stack.Screen name='CreateRoom' component={CreateRoom} options={{ headerShown: false }} />
            <Stack.Screen name='SearchUser' component={SearchUser} options={{ headerShown: false }} />
            <Stack.Screen name='JoinRoom' component={JoinRoom} options={{ headerShown: false }} />
            <Stack.Screen name='JoinRoomByName' component={JoinRoomByName} options={{ headerShown: false }} />
            <Stack.Screen name='AssignChore' component={AssignChore} options={{ headerShown: false }} />
            <Stack.Screen name='ViewAllChores' component={ViewAllChores} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
