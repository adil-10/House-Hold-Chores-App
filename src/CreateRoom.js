// if user is in a room he can not create a new one
import React, { Component } from 'react';
import { Text, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import firebase from '../config';
import { Ionicons } from '@expo/vector-icons';

export default class CreateRoom extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            roomName: '',
            isModalVisible: false,
            modalMessage: ''
        };
    }
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

    createRoom = async () => {
        try {
            const userId = firebase.auth().currentUser.uid;
            if (!userId) {
                this.showModal('User is not authenticated');
                return;
            }

            const { currentUser } = firebase.auth();
            const { roomName } = this.state;
            const roomId = uuidv4();
            const roomRef = firebase.firestore().collection('Rooms').doc(roomId);


            if (!roomName) {
                if (!roomNameQuery.empty) {
                    this.showModal('Enter a room name');
                    return;
                }
            }

            // Check if room name is already taken
            const roomNameQuery = await firebase.firestore().collection('Rooms')
                .where('roomName', '==', roomName)
                .get();
            if (!roomNameQuery.empty) {
                this.showModal('This room name is already taken');
                return;
            }

            // Check if user is already in a room
            const userRooms = await firebase.firestore().collection('Rooms')
                .where('members', 'array-contains', currentUser.uid)
                .get();
            if (!userRooms.empty) {
                this.showModal('You are already in a room');
                return;
            }
            // When validations complete allow user to create a room
            await firebase.firestore().runTransaction(async (transaction) => {
                // Create room document
                await transaction.set(roomRef, {
                    roomName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    id: roomId,
                    createdBy: currentUser.uid,
                    members: [currentUser.uid],
                });

                const tasksRef = roomRef.collection('tasks');
                const shoppingRef = roomRef.collection('shoppingList');
                this.showModal('Room created');
                // Reset the input fields
                return;
            });
            console.log('Room created successfully');
        }
        catch (error) {
            console.log(error.message);
            // Show error message to the user   
            this.showModal(error.message,);
            return;
        }
    }

    render() {
        return (

            <View style={styles.container}>
                <Image source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/inAppColour.avif')} style={{
                    position: 'absolute',
                    zIndex: -1,
                    width: '100%',
                    height: '100%',
                    opacity: 0.5,
                    borderRadius: 20,
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
                    <Text style={styles.title}>Enter room name</Text>

                    <TextInput style={styles.Roomname}
                        placeholder='Room Name'
                        onChangeText={roomName => this.setState({ roomName })}
                        value={this.state.roomName}
                        placeholderTextColor="gray"
                    />
                    <TouchableOpacity style={styles.button}
                        onPress={this.createRoom}>
                        <Text style={styles.buttonText}>create room</Text>
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
            </View >
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
    title: {
        paddingLeft: '30%',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    Roomname: {
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 5,
        width: '100%',
        height: 50,
        marginTop: 10,
        paddingHorizontal: 10,
        fontSize: 16,
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
    }
})