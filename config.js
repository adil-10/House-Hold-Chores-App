//setting up fire base
// Importing required modules from Firebase SDK

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/functions';
const firebaseConfig = {
  apiKey: "AIzaSyB6BbEHdeZpWAKxgyTOxhu-173JoOIEjXc",
  authDomain: "house-hold-chores-app.firebaseapp.com",
  databaseURL: "https://house-hold-chores-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "house-hold-chores-app",
  storageBucket: "house-hold-chores-app.appspot.com",
  messagingSenderId: "448982541181",
  appId: "1:448982541181:web:d405e031d8ac0fdef8e214",
  measurementId: "G-81174C5G3L"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
