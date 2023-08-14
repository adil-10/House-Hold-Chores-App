import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import firebase from '../config';
import { useRoute } from '@react-navigation/native';

const JoinRoom = () => {
    const route = useRoute();
    const { roomId, userId } = route.params;

    console.log('roomId:', roomId); // log roomId to the console
    console.log('userId:', userId); // log userId to the console

    useEffect(() => {
        if (userId && roomId) {
            // Add the user to the room using the roomId
            const roomRef = firebase.firestore().collection('Rooms').doc(roomId);
            roomRef.update({
                members: firebase.firestore.FieldValue.arrayUnion(userId),
            })
                .then(() => {
                    console.log('User added to the room');
                })
                .catch((error) => {
                    console.log('Error adding user to the room: ', error);
                });
        }
    }, [roomId, userId]);

    return (
        <View>
            <Text>Joining Room...</Text>
        </View>
    );
};

export default JoinRoom;
