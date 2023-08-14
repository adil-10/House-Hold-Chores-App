import React, { Component } from 'react';
import { Text, SafeAreaView, Modal, View, TouchableOpacity, StyleSheet, FlatList, Image, Picker } from 'react-native';
import firebase from '../config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            userRoom: [],
            chores: [],
            updatedChores: [],
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

    //Check if user authenticated, if not log user out
    componentDidMount() {
        const userId = firebase.auth().currentUser.uid;

        firebase
            .firestore()
            .collection('users')
            .doc(userId)
            .get()
            .then(snapshot => {
                //is user exists display room data
                if (snapshot.exists) {
                    this.setState({ name: snapshot.data() });
                    this.getRooms();
                    //else show response of user not found
                }
                else {
                    this.showModal('User not found');
                    return;
                }
            });

        //Checks for any changes such as user logging in or out
        this.interval = setInterval(() => this.getChoresData(), 8000);
        this.unsubscribe = firebase.auth().onAuthStateChanged(user => {
            this.unsubscribe = this.props.navigation.addListener('focus', () => {
                this.getRooms();
                //if user not signed in, modal is shown and user is navigated to login page
                if (!user) {
                    this.showModal('User signed out');
                    navigation.navigate('Login');
                    return;
                }
            });
        });

    }

    componentWillUnmount() {
        clearInterval(this.interval);
        this.unsubscribe();
    }

    // get room data to show if a user is a member of a room
    getRooms = async () => {
        //Check if user is logged in 
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }

        // Get a reference to the Rooms collection and documents in Rooms
        const roomsRef = firebase.firestore().collection('Rooms');
        const snapshot = await roomsRef.get();

        // Initialize arrays to hold all rooms and the user's room
        const rooms = [];
        const userRoom = [];

        // Loop through all documents in the Rooms collection
        snapshot.forEach(doc => {
            const data = doc.data();

            // Create a new room object with the document ID, room name, members, and room URL
            const room = {
                id: doc.id,
                roomName: data.roomName,
                members: data.members,
                // roomURL: data.roomUrl,
                createdBy: data.createdBy,
                createdAt: data.createdAt
            };
            // Add the new room object to the rooms array
            rooms.push(room);
        });

        // Loop through all rooms and add the user's room to the userRoom array
        try {
            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];
                // Check if the members array includes the user's ID
                if (room.members.includes(userId)) {
                    this.state.userRoom.push(room);
                }
            }
            this.setState({ userRoom: this.state.userRoom });
            console.log(this.state.userRoom)
            await this.getChoresData();
        }
        catch (error) {
            this.showModal('Error displaying room: ', error);
            return;
        }
    };

    getChoresData = async () => {
        try {
            const userId = firebase.auth().currentUser.uid;
            //Check if user is logged in and authenticated
            if (!userId) {
                this.showModal('User is not authenticated');
                return;
            }
            //if user is not in a room, set chores array to empty, render no chores
            if (this.state.userRoom.length === 0) {
                this.setState({ chores: [] });
                return;
            }

            // Get the room ID of the user's current room.
            const roomId = this.state.userRoom[0].id;
            // Get a reference to the collection of tasks for the current room. get a snapshot of all tasks within the Room
            const choresRef = firebase.firestore().collection('Rooms').doc(roomId).collection('tasks');
            const snapshot = await choresRef.get();
            //map each task to an object that includes the task data and the assigned user's first and last name.
            const chores = snapshot.docs.map(async (doc) => {
                const assignedUserId = doc.data().currentlyAssignedTo;
                // if assigneduserid is not null, get the first and last name of user the task is assigned to and all other data of the task
                if (assignedUserId) {
                    const userDoc = await firebase.firestore().collection('users').doc(assignedUserId).get();
                    const { firstName, lastName } = userDoc.data();
                    return { id: doc.id, firstName, lastName, ...doc.data() };

                }
            });
            // Wait for all the mapped task objects to be resolved, filter out any undefined objects
            // Set the state of the component with the resulting array of assigned chores.
            const assignedChores = await Promise.all(chores);
            this.setState({ chores: assignedChores.filter(chore => chore !== undefined) });
        }
        catch (error) {
            this.showModal('Error displaying chores:', error);
            return;
        }
    };


    //Handle a  completed chore
    handleChoreCheck = (chore) => {
        //Check if user is logged in and authenticated
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }
        //get room id of users current room
        const roomId = this.state.userRoom[0].id;

        // Retrieve a reference to all tasks that match the given chore ID
        const tasksRef = firebase.firestore()
            .collection('Rooms')
            .doc(roomId)
            .collection('tasks')
            .where('taskId', '==', chore.id);

        tasksRef.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                // get data in tasks sub collection
                const taskData = doc.data();

                // check if the current user is assigned to the chore
                if (taskData.currentlyAssignedTo === userId) {
                    // update chore with the current user as the last completed by, set currentlyAssignedTo to empty, and update lastCompletedAt with the server timestamp
                    doc.ref.update({
                        lastCompletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastCompletedBy: taskData.currentlyAssignedTo,
                        currentlyAssignedTo: '',
                    })
                        .then(() => {
                            this.getChoresData();
                        })
                        .catch((error) => {
                            this.showModal('Error updating chore');
                            return;
                        });
                }
                // If the current user is not assigned to the chore, show a modal
                else {
                    this.showModal('Chore is not assigned to the current user');
                    return;
                }
            });
        })
            .catch((error) => {
                this.showModal('Error please try later: ', error,);
                return;
            });
    }

    //user leaving room
    leaveRoom = async (roomId) => {
        try {
            //Check if user is logged in and authenticated
            const userId = firebase.auth().currentUser.uid;
            if (!userId) {
                this.showModal('User is not authenticated');
                return;
            }

            // Get a reference to the room document in Firestore and tasks subcollection
            const roomRef = firebase.firestore().collection('Rooms').doc(roomId);
            const taskRef = roomRef.collection('tasks');

            // Remove the user's ID from the members array
            await roomRef.update({
                members: firebase.firestore.FieldValue.arrayRemove(userId)
            });

            // Set assignedTo field to empty for any task documents where it matches the user's ID

            const taskDocs = await taskRef.where('currentlyAssignedTo', '==', userId).get();
            taskDocs.forEach(doc => {
                doc.ref.update({
                    currentlyAssignedTo: ''
                });
            });
            // Show modal and call to get rooms to show user is no longer in room
            this.showModal('You have left the room');
            this.setState({
                userRoom: [],
                chores: []
            });
            this.getRooms();
        }
        catch (error) {
            this.showModal('Error leaving room: ');
            return;
        }
    }

    render() {
        const navigation = this.props.navigation;
        const userIsInRoom = this.state.userRoom.length > 0;
        return (
            <SafeAreaView style={styles.container}>
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
                    height: '8%',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 20
                }}>
                    <View style={styles.houseName}>
                        <Text style={styles.houseNameText}>{this.state.userRoom.length > 0 ? this.state.userRoom[0].roomName : ''}</Text>
                    </View>
                </View>

                <View style={{
                    paddingBottom: 40,
                    paddingTop: 15,
                    borderBottomWidth: 1,
                    borderColor: 'black',

                }}>

                    <TouchableOpacity onPress={() => this.props.navigation.navigate('CreateRoom')}>
                        <Image
                            source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/create.png')}
                            style={{
                                position: 'absolute',
                                width: '8%',
                                height: '5%',
                                top: 0,
                                right: 0,
                                paddingHorizontal: 20,
                                paddingVertical: 20,
                                marginRight: 130
                            }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => this.props.navigation.navigate('JoinRoomByName')}>
                        <Image
                            source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/JoinHouse.png')}
                            style={{
                                position: 'absolute',
                                width: '8%',
                                height: '5%',
                                top: 0,
                                right: 0,
                                paddingHorizontal: 20,
                                paddingVertical: 20,
                                marginRight: 70
                            }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity disabled={!userIsInRoom} onPress={() => this.leaveRoom(this.state.userRoom[0].id)}>
                        <Image
                            source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/leaveRoom.png')}
                            style={{
                                position: 'absolute',
                                width: '8%',
                                height: '5%',
                                top: 0,
                                right: 0,
                                paddingHorizontal: 20,
                                paddingVertical: 20,
                                marginRight: 20
                            }}
                        />
                    </TouchableOpacity>
                </View>


                <View style={styles.dataContainer}>
                    <FlatList
                        data={this.state.chores}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) =>
                            <View style={styles.choreContainer}>


                                <View style={[styles.choreName]}>

                                    <Text style={[styles.choreNameText]}>
                                        {item.choreName}
                                    </Text>
                                    <Text style={[styles.choreDescText]}>
                                        {item.choreDesc}
                                    </Text>
                                    <Text style={styles.assignedToText}>
                                        Assigned to: {item.firstName} {item.lastName}
                                    </Text>

                                </View>

                                <View>
                                    <TouchableOpacity
                                        style={styles.completeButton}
                                        onPress={() => this.handleChoreCheck(item)}>
                                        <MaterialIcons name={'check-box'} size={30} />
                                    </TouchableOpacity>
                                </View>

                            </View>
                        }
                    />
                </View>

                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                }}>
                    <TouchableOpacity style={styles.ViewStyle} disabled={!userIsInRoom} onPress={() => this.props.navigation.navigate("ViewAllChores")}>
                        <Image
                            source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/ViewAll.png')}
                            style={styles.imageStyle}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addStyle} disabled={!userIsInRoom} onPress={() => this.props.navigation.navigate("AssignChore")}>
                        <Image style={styles.addimageStyle} source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/pluscircle.png')} />

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
            </SafeAreaView>
        );
    }
}
export default HomePage

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 20,
        backgroundColor: '#F8F8F8',

    },
    houseName: {
        width: '100%',
        paddingLeft: 20,
        marginTop: 15,
        paddingBottom: 10,
    },
    houseNameText: {
        color: 'black',
        fontSize: 30,
        fontWeight: 'bold',
    },
    dataContainer: {
        width: '100%',
        height: '70%'
    },
    choreContainer: {
        alignItems: 'flex-start',
        marginBottom: 0,
        paddingTop: 20,
        paddingLeft: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },

    choreName: {
        width: '90%'
    },
    choreNameText: {
        fontSize: 20,
        fontWeight: 'bold',
        width: '100%',
        paddingBottom: 1
    },
    choreDescText: {
        fontSize: 15,
        width: '100%',
        paddingBottom: 4
    },
    assignedToText: {
        fontSize: 15,
        width: '100%',
        paddingBottom: 4
    },
    completeButton: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 20,
    },
    ViewStyle: {
        marginLeft: 50,
        marginBottom: 10,
    },
    addStyle: {

        marginRight: 50,
        marginBottom: 10,

    },
    addimageStyle: {
        width: 70,
        height: 70,
    },
    imageStyle: {
        width: 60,
        height: 60,
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

// if user leaves room, re render the page so it shows he isnt in a room