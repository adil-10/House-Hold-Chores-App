import React, { Component } from 'react';
import { Text, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet, FlatList, Picker } from 'react-native';
import firebase from '../config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';

export default class ViewAllChores extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            userRoom: [],
            chores: [],
            members: [],
            membersId: [],
            selectedMember: '',
            choreNameArr1: [],
            choreDescArr1: [],
            isModalVisible: false,
            modalMessage: ''
        };
    }
    //toggle and close modal
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

    // get room data to show if a user is a member of a room
    getRooms = async () => {
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }
        // Get a reference to the Rooms collection
        const roomsRef = firebase.firestore().collection('Rooms');

        try {
            // Get all documents in the "Rooms" collection
            const snapshot = await roomsRef.get();

            // Initialise arrays to hold all rooms and the user's room
            const rooms = [];
            const userRoom = [];

            // Loop through all documents in the "Rooms" collection
            for (const doc of snapshot.docs) {
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

                    // Initialise array to hold member names
                    const memberNames = [];
                    const memberId = [];

                    // Loop through all members in the room
                    for (let i = 0; i < room.members.length; i++) {
                        const member = room.members[i];
                        const userRef = firebase.firestore().collection('users').doc(member);

                        // Get user data for the member
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
            }

            // Loop through all rooms and add the user's room to the userRoom array
            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];
                // Check if the members array includes the user's auth ID
                if (room.members.includes(userId)) {
                    this.state.userRoom.push(room);
                }
            }

            this.setState({ userRoom: this.state.userRoom });
            // Get chores data after getting room data
            return this.getChoresData();
        }
        catch (error) {
            this.showModal('Error displaying room:', error);
            return;
        }
    };

    //shows all tasks
    getChoresData = async () => {
        //get roomId of current of of user
        const roomId = this.state.userRoom[0].id;
        //get reference to collection Rooms and subcollection tasks of users current room
        const choresRef = firebase.firestore().collection('Rooms').doc(roomId).collection('tasks');
        //check if user if logged in and uathenticated
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }

        try {
            //get snapshot all documents of subcollection tasks
            const snapshot = await choresRef.get();
            //innitialise array
            const allChores = [];
            const choreNameArr = [];
            const choreDescArr = [];

            // Loop through all docs in tasks, push data of chore in all chores, push data of chorename and chore desc within choreNameArr and choreDescArr
            snapshot.forEach(doc => {
                const choreData = doc.data();
                allChores.push({ id: doc.id, ...doc.data() });
                choreNameArr.push(choreData.choreName);
                choreDescArr.push(choreData.choreDesc);
            });
            // Set states
            this.setState({
                chores: allChores,
                choreNameArr1: choreNameArr,
                choreDescArr1: choreDescArr
            });
            console.log('chore name', choreNameArr);
            console.log('chore desc', choreDescArr);
            console.log('Chores:', allChores);
        }
        catch (error) {
            this.showModal('Error getting chores: ', error,);
            return;
        }
    };

    //Patch to reassign a chore only after 24 hours
    reassignChore = async (chore) => {
        //Check if user is logged in
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }
        //Get room id of users current room
        const roomId = this.state.userRoom[0].id;
        //Get selected member from picker, store in currentlyAssignedTo
        const currentlyAssignedTo = this.state.selectedMember;

        let lastCompletedAt;
        let hoursSinceLastCompleted;

        // If there is a last completed timestamp for the chore, calculate the hours since last completed
        if (chore.lastCompletedAt) {
            lastCompletedAt = chore.lastCompletedAt.toDate();
            const timeSinceLastCompleted = new Date() - lastCompletedAt;
            hoursSinceLastCompleted = timeSinceLastCompleted / (1000 * 60 * 60);
        }

        // Check if 24 hours have passed since the last completed timestamp
        if (hoursSinceLastCompleted && hoursSinceLastCompleted < 24) {
            console.log('Cannot reassign chore until 24 hours have passed since it was last completed');
            this.showModal('Cannot reassign chore until 24 hours have passed since it was last completed');
            return;
        }

        // Otherwise within tasks find task where chore.id matches the taskId
        firebase
            .firestore()
            .collection('Rooms')
            .doc(roomId)
            .collection('tasks')
            .where('taskId', '==', chore.id)
            .get()
            .then((querySnapshot) => {
                // Loop through the result set and update each matching task with the new assigned user
                querySnapshot.forEach((doc) => {
                    // Get a reference to the document and update the currentlyAssignedTo field with the new user
                    const assignedDocRef = firebase
                        .firestore()
                        .collection('Rooms')
                        .doc(roomId)
                        .collection('tasks')
                        .doc(doc.id);
                    assignedDocRef.update({
                        currentlyAssignedTo
                    })
                        .then(() => {
                            this.showModal('Chore reassigned successfully:');
                            return;
                        })
                        .catch((error) => {
                            this.showModal('Error reassigning chore: ', error);
                            return;
                        });
                });
            })
            .catch((error) => {
                console.error('Error: ', error);
            });
    };


    updateChoreData = async (chore, choreName, choreDesc) => {
        //Check if user is logged in and authenticated
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }
        try {
            //Get room id of users current room
            const roomId = this.state.userRoom[0].id;
            //get task if of chore user wishes to update
            const taskId = chore.taskId;
            //Go to subcollection tasks of users room, set new states of choreName and choreDesc
            firebase
                .firestore()
                .collection('Rooms')
                .doc(roomId)
                .collection('tasks')
                .doc(taskId)
                .update({
                    choreName: choreName,
                    choreDesc: choreDesc
                })
                .then(() => {
                    this.showModal('Chore details updated');
                    return;
                })
                .catch((error) => {
                    this.showModal('Error updating chore: ', error);
                    return;
                });
        }
        catch (error) {
            this.showModal('Error: ', error);
            return;
        }
    };

    //delete chore
    deleteChore = async (chore) => {
        //Check if user is logged in and authenticated
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }

        try {
            console.log(userId)
            //get roomm id of users current room
            const roomId = this.state.userRoom[0].id;
            //get task id of selected room
            const taskId = chore.taskId;
            // Get a reference to the room document in Firestore
            const choreRef = firebase.firestore().collection('Rooms').doc(roomId).collection('tasks').doc(taskId);
            //Remove chore
            await choreRef.delete();
            this.getChoresData();

            this.showModal('Chore removed');
            return;
        }
        catch (error) {
            this.showModal('Error deleting chat: ', error,);
            return;
        }
    };

    componentDidMount() {
        this.getRooms();
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
                    height: '5%',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 20,
                }}>
                    <Text style={styles.headerText}>Chores Do it</Text>
                    <View style={styles.Iconleft}>
                        <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.dataContainer}>
                    <FlatList
                        data={this.state.chores}
                        renderItem={({ item, index }) => {
                            return (
                                <View style={styles.choreContainer}>
                                    <View style={styles.choreName}>
                                        <TextInput
                                            style={styles.input}
                                            //Set value text input to the index of choreNameArr1 or set it nothing
                                            value={this.state.choreNameArr1[index] ?? ''}
                                            //Call onchange text function, where user inputted data is stores within choreNameArr1 at given index
                                            onChangeText={(choreName) => {
                                                let choreNameArr1 = [...this.state.choreNameArr1];
                                                choreNameArr1[index] = choreName;
                                                this.setState({ choreNameArr1 });
                                            }}
                                        />
                                    </View>
                                    <View style={styles.choreName}>
                                        <TextInput
                                            style={styles.input}
                                            //Set value text input to the index of choreDescArr1 or set it nothing
                                            value={this.state.choreDescArr1[index] ?? ''}
                                            //Call onchange text function, where user inputted data is stores within choreDescArr1 at given index
                                            onChangeText={(choreDesc) => {
                                                let choreDescArr1 = [...this.state.choreDescArr1];
                                                choreDescArr1[index] = choreDesc;
                                                this.setState({ choreDescArr1 });
                                            }}
                                        />
                                    </View>
                                    <View style={styles.pickerPadding}>
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
                                    </View >

                                    <TouchableOpacity
                                        style={styles.updateDataButton}
                                        onPress={() => {
                                            if (!this.state.selectedMember) {
                                                console.log('Please select a member before reassigning the chore');
                                                return;
                                            }
                                            this.reassignChore(item);
                                        }}>
                                        <Text style={styles.saveDataText}>Save chore reassignment</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.updateDataButton}
                                        //Pass this.state.choreNameArr1[index], this.state.choreDescArr1[index] into updateChoreData function
                                        onPress={() => this.updateChoreData(item, this.state.choreNameArr1[index], this.state.choreDescArr1[index])}>
                                        <Text style={styles.saveDataText}>Update chore</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteIcon}
                                        onPress={() => this.deleteChore(item)}>
                                        <MaterialIcons name={'delete'} size={30} />
                                    </TouchableOpacity>

                                </View>
                            );
                        }
                        }
                        keyExtractor={item => item.id}
                    />
                </View >
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
    dataContainer: {
        width: '90%',
        flex: 1,
        paddingLeft: 40
    },
    choreContainer: {
        height: '100%'
    },
    input: {
        marginTop: 15,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    picker: {
        width: '100%',
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 5,
        height: 50,
        backgroundColor: 'transparent',
    },
    choreName: {
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 5,
        width: '100%',
        height: 50,
        marginTop: 10,
    },
    pickerPadding: {
        width: '100%',
        height: 50,
        paddingBottom: 10,
    },
    updateDataButton: {
        width: '100%',
        backgroundColor: '#DDDDDD',
        padding: 10,
        marginTop: 10,
        borderRadius: 5,
    },
    saveDataText: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    buttonStyles: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    deleteIcon: {
        marginRight: 10,
        marginTop: 10,
        paddingLeft: '40%'
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
