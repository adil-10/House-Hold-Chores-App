import React, { Component } from 'react';
import { Text, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet, Picker } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebase from '../config';
import { v4 as uuidv4 } from 'uuid';

export default class AssignChore extends Component {
    constructor(props) {
        super(props);
        this.state = {
            choreName: '',
            choreDesc: '',
            userRoom: [],
            members: [],
            membersId: [],
            selectedMember: '',
            isModalVisible: false,
            modalMessage: ''
        };
    }

    //Toggle modal open and closed
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

    componentDidMount() {
        this.getRooms();
    }
    // get room data to show if a user is a member of a room
    getRooms = async () => {
        try {
            const userId = firebase.auth().currentUser.uid;
            //Check if user is logged in 
            if (!userId) {
                this.showModal('User is not authenticated');
                return;
            }

            // Get a reference to the Rooms collection, get all documents within  Rooms
            const roomsRef = firebase.firestore().collection('Rooms');
            const snapshot = await roomsRef.get();

            // Initialize arrays to hold all rooms and the user's room
            const rooms = [];
            const userRoom = [];

            // Loop through all documents in the "Rooms" collection
            snapshot.forEach(async (doc) => {
                const data = doc.data();

                // Create a new room object with the document ID, room name, members, and room URL
                const room = {
                    id: doc.id,
                    roomName: data.roomName,
                    members: data.members,
                    roomURL: data.roomUrl,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt,
                };

                // Add the new room object to the rooms array
                rooms.push(room);

                // Check if the members array includes the user's auth ID
                if (room.members.includes(userId)) {
                    userRoom.push(room);

                    // Initialize array to hold member names
                    const memberNames = [];
                    const memberId = [];

                    // Loop through all members in the room
                    for (let i = 0; i < room.members.length; i++) {
                        const member = room.members[i];
                        const userRef = firebase.firestore().collection('users').doc(member);
                        const userSnapshot = await userRef.get();
                        const userData = userSnapshot.data();

                        // Add member's user_id to the memberId array
                        memberId.push(userData.user_id);
                        // Add member's first and last names to the memberNames array
                        memberNames.push(userData.firstName + ' ' + userData.lastName);
                    }

                    // Update state with the memberNames array
                    this.setState({ members: memberNames });
                    this.setState({ membersId: memberId });
                }
            });
            this.setState({ userRoom });
        }
        catch (error) {
            this.setState({
                isModalVisible: true,
                modalMessage: error.message,
            });
            setTimeout(() => {
                this.setState({ isModalVisible: false });
            }, 2000);
        }
    };

    //Creating a task
    createTask = async () => {

        // Get the selected room object from state
        const selectedRoom = this.state.userRoom[0];
        // Get the selected member ID from state
        const selectedMemberId = this.state.selectedMember;

        //Check if user is logged in 
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }
        // Validate inputs
        if (!this.state.choreName) {
            this.showModal('Enter a chore name');
            return;
        }

        if (this.state.choreDesc.length > 250) {
            this.showModal('Chore description can not exceed 250 characters');
            return;
        }

        if (!selectedMemberId) {
            this.showModal('Select a member to assign a chore');
            return;

        }

        // Generate new IDs using uuidv4
        const taskId = uuidv4();

        // Create a new task object with the chore name, description, and user ID
        const task = {
            choreName: this.state.choreName,
            choreDesc: this.state.choreDesc,
            createdBy: firebase.auth().currentUser.uid,
            currentlyAssignedTo: selectedMemberId,
            lastCompletedBy: '',
            lastCompletedAt: '',
            roomId: selectedRoom.id,
            taskId: taskId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            taskId: taskId
        };

        // Get a reference to the tasks subcollection for the selected room
        const tasksRef = firebase.firestore().collection('Rooms').doc(selectedRoom.id).collection('tasks');

        try {
            // Add the new task and assignment documents to their respective subcollections using the generated IDs
            await tasksRef.doc(taskId).set(task);

            // Show modal to tell user that the task was added successfully
            this.showModal('Chore assigned successfully');


            // Reset the input fields
            this.setState({
                choreName: '',
                choreDesc: '',
                selectedMember: '',
            });
            return;
        } catch (error) {
            this.setState({
                isModalVisible: true,
                modalMessage: error,
            });
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
                    paddingTop: '50%',
                    paddingHorizontal: '5%'
                }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter chore name"
                        onChangeText={(text) => this.setState({ choreName: text })}
                        value={this.state.choreName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter chore description"
                        onChangeText={(text) => this.setState({ choreDesc: text })}
                        value={this.state.choreDesc}
                    />

                    <Picker
                        style={styles.picker}
                        selectedValue={this.state.selectedMember}
                        onValueChange={(itemValue) =>
                            this.setState({ selectedMember: itemValue })
                        }>
                        <Picker.Item label="Select a member" value={null} />

                        {/*  Render a list of Picker components based on the state variable members */}
                        {this.state.members.map((member, index) => (
                            // For each member, create a Picker.Item with a label and value
                            <Picker.Item key={index} label={member} value={this.state.membersId[index]} />
                        ))}
                    </Picker>

                    <TouchableOpacity style={styles.button} onPress={this.createTask}>
                        <Text style={styles.buttonText}>Assign Chore</Text>
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
    input: {
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 5,
        width: '100%',
        height: 50,
        marginTop: 10,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    picker: {
        width: '100%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 5,
        height: 50,
        backgroundColor: 'transparent'
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
});
