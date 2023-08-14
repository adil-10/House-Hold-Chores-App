import React, { Component } from 'react';
import { Text, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebase from '../config';

export default class JoinRoomByName extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomName: '',
            user_id: firebase.auth().currentUser.uid,
            isModalVisible: false,
            modalMessage: ''
        };
    }
    //toggle modal open and close
    closeModal = () => {
        this.setState({ isModalVisible: false });
    };

    showModal = (message) => {
        this.setState({
            isModalVisible: true,
            modalMessage: message,
        });
        setTimeout(() => {
            this.setState({ isModalVisible: false });
        }, 2000);
    };
    //Validate to see if user can join a room
    joinRoom = async () => {
        // Validate the room name.
        const roomName = this.state.roomName.trim();
        if (!roomName) {
            this.showModal('Please enter a room name');
            return;
        }
        //Check to see if user is already in room
        const userRoomsRef = firebase.firestore().collection('Rooms').where('members', 'array-contains', this.state.user_id);
        const userRoomsSnapshot = await userRoomsRef.get();
        if (!userRoomsSnapshot.empty) {
            this.showModal('You cannot join another room while being in a room');
            return;
        }

        // Check if the room exists.
        const roomsRef = firebase.firestore().collection('Rooms');
        const querySnapshot = await roomsRef.where('roomName', '==', roomName).get();
        if (querySnapshot.empty) {
            this.showModal('Room not found');
            return;
        }
        const roomId = querySnapshot.docs[0].id;
        const roomRef = roomsRef.doc(roomId);

        // Check if the user has already joined the room.
        const roomData = await roomRef.get();
        if (!roomData.exists) {
            this.showModal('Error joining room');
            return;
        }
        //Check if user is in room already 
        const roomMembers = roomData.data().members;
        if (roomMembers.includes(this.state.user_id)) {
            this.showModal('You have already joined this room');
            return;
        }

        // Add the user to the room.
        roomMembers.push(this.state.user_id);
        try {
            await roomRef.update({ members: roomMembers });
            this.showModal(roomName + ' joined successfully');
        } catch (error) {
            console.error(error);
            this.showModal(error.message);
        }
    };

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/inAppColour.avif')} style={{
                    position: 'absolute',
                    zIndex: -1,
                    width: '100%',
                    height: '100%',
                    opacity: 0.5,
                    borderRadius: 20
                }} />

                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FEFFEB',
                    height: '7.5%',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 20
                }}>
                    <Text style={styles.headerText}>Chores Do it</Text>
                    <View style={styles.Iconleft}>
                        <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{
                    paddingTop: '60%',
                    paddingHorizontal: '5%'
                }}>
                    <Text style={styles.title}> Join a room</Text>
                    <TextInput
                        style={styles.roomInput}
                        placeholder="Room name"
                        onChangeText={(text) => this.setState({ roomName: text })}
                        value={this.state.roomName}
                    />
                    <TouchableOpacity style={styles.button} onPress={this.joinRoom}>
                        <Text style={styles.buttonText}>Join Room</Text>
                    </TouchableOpacity>
                </View>
                <Modal
                    transparent={true}
                    visible={this.state.isModalVisible}
                    animationType='slide'
                    onRequestClose={() => {
                        this.closeModal();
                    }}>
                    <View style={styles.modal}>
                        <Text style={styles.modalText}>{this.state.modalMessage}</Text>
                    </View>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 20,
    },
    headerText: {
        color: 'black',
        fontSize: 30,
        fontWeight: '600',
        marginLeft: 50,
    },
    Iconleft: {
        position: 'absolute',
        top: 0,
        left: 0,
        marginLeft: 15,
        marginTop: 10,
    },
    roomInput: {
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 5,
        width: '100%',
        height: 50,
        marginTop: 10,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    title: {
        paddingLeft: '35%',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#c8ada4',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        width: '100%',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalContainer: {
        // flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 20,
        backgroundColor: '#E2C2C6',
        borderRadius: 10,
    },
})