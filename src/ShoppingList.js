import React, { Component } from 'react';
import { Text, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import firebase from '../config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { v4 as uuidv4 } from 'uuid';
import { FlatList } from 'react-native-gesture-handler';

class ShoppingList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
            userRoom: [],
            shoppingItem: '',
            itemPrice: '',
            isModalVisible: false,
            modalMessage: ''
        };
    }

    //Toggle and close modal
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
        this.interval = setInterval(() => this.getItemData(), 8000);
    }
    componentWillUnmount() {
        clearInterval(this.interval);
    }
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
            return this.getItemData();
        }
        catch (error) {
            this.showModal('Error displaying room:', error);
            return;
        }
    };

    //Creating a task
    addItem = async () => {

        // Get the selected room object from state
        const selectedRoom = this.state.userRoom[0];
        console.log(selectedRoom)

        //Check if user is logged in 
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }

        // Validate inputs
        if (!this.state.shoppingItem || !this.state.itemPrice) {
            this.showModal('All fields must be entered');
            return;
        }
        if (!/^\d+(\.\d+)?$/.test(this.state.itemPrice) && !/^\d+$/.test(this.state.itemPrice)) {
            this.showModal('Incorrect price');
            return;
        }

        // Generate new IDs using uuidv4
        const shoppingItemId = uuidv4();

        // Create a new item object with the item name and price
        const items = {
            shoppingItem: this.state.shoppingItem,
            itemPrice: this.state.itemPrice,
            createdBy: firebase.auth().currentUser.uid,
            shoppingItemId: shoppingItemId
        };

        // Get a reference to the shoppingList subcollection for the selected room
        const shoppingRef = firebase.firestore().collection('Rooms').doc(selectedRoom.id).collection('shoppingList');

        try {
            // Add the new item to their respective subcollections using the generated IDs
            await shoppingRef.doc(shoppingItemId).set(items);

            // Show modal to tell user that the task was added successfully
            this.showModal('Shopping item added successfully');


            // Reset the input fields
            this.setState({
                shoppingItem: '',
                itemPrice: '',

            });
            this.getItemData();
            return;
        } catch (error) {
            this.setState({
                isModalVisible: true,
                modalMessage: error,
            });
        }
    }

    //delete item
    deleteItem = async (items) => {
        //Check if user is logged in and authenticated
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }

        try {
            //get roomm id of users current room
            const roomId = this.state.userRoom[0].id;
            //get item id of selected room
            const shoppingItemId = items.shoppingItemId;
            // Get a reference to the room document in Firestore
            const itemRef = firebase.firestore().collection('Rooms').doc(roomId).collection('shoppingList').doc(shoppingItemId);
            //Remove item
            await itemRef.delete();
            this.getItemData();
            this.showModal('Item removed');
            return;
        }
        catch (error) {
            this.showModal('Error deleting chat: ', error,);
            return;
        }
    };

    //shows all tasks
    getItemData = async () => {
        //get roomId of current of of user
        const selectedRoom = this.state.userRoom[0];
        console.log(selectedRoom)
        //get reference to collection Rooms and subcollection tasks of users current room
        const itemRef = firebase.firestore().collection('Rooms').doc(selectedRoom.id).collection('shoppingList');
        //check if user if logged in and uathenticated
        const userId = firebase.auth().currentUser.uid;
        if (!userId) {
            this.showModal('User is not authenticated');
            return;
        }

        try {
            //get snapshot all documents of subcollection tasks
            const snapshot = await itemRef.get();
            //innitialise array
            const allItems = [];

            // Loop through all docs in tasks, push data of chore in all chores, push data of chorename and chore desc within choreNameArr and choreDescArr
            snapshot.forEach(doc => {
                allItems.push({ id: doc.id, ...doc.data() });
            });
            // Set states
            this.setState({
                items: allItems,
            });
            console.log('items: ' + allItems)
        }
        catch (error) {
            this.showModal('Error getting items: ', error,);
            return;
        }
    };

    render() {

        const navigation = this.props.navigation;
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
                    height: '8%',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 20
                }}>
                    <Text style={styles.headerText}>Chores Do it</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputBoxItem}
                        placeholder="Items"
                        placeholderTextColor="gray"
                        onChangeText={(text) => this.setState({ shoppingItem: text })}
                        value={this.state.shoppingItem}
                    />
                    <TextInput
                        style={styles.inputBoxPrice}
                        placeholder="£"
                        placeholderTextColor="gray"
                        onChangeText={(text) => this.setState({ itemPrice: text })}
                        value={this.state.itemPrice}
                    />

                    <TouchableOpacity onPress={this.addItem} style={styles.addButton}>
                        <Text style={styles.addButtonLabel}>Add</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dataContainer}>
                    <FlatList
                        data={this.state.items}
                        renderItem={({ item }) => (
                            <View style={styles.itemContainer}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.shoppingItem}</Text>
                                    <Text style={styles.itemPrice}> £{item.itemPrice}</Text>
                                    <TouchableOpacity
                                        style={styles.deleteIcon}
                                        onPress={() => this.deleteItem(item)}>
                                        <MaterialIcons name={'delete'} size={30} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                    />
                </View>

                <Modal
                    transparent={true}
                    visible={this.state.isModalVisible}
                    animationType='slide'
                    onRequestClose={() => {
                        this.closeModal();
                    }}
                >
                    <View style={styles.modal}>
                        <Text style={styles.modalText}>{this.state.modalMessage}</Text>
                    </View>
                </Modal>


            </View >
        );
    }
}

export default ShoppingList

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
        marginLeft: 20,
    },
    inputContainer: {
        paddingTop: '2%',
        paddingHorizontal: '5%',
    },
    inputBoxItem: {
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 5,
        height: 50,
        marginTop: 10,
        fontSize: 16,
        paddingHorizontal: 10,
    },
    inputBoxPrice: {
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 5,
        width: '20%',
        height: 50,
        marginTop: 10,
        fontSize: 16,
        paddingHorizontal: 10,
    },
    addButton: {
        backgroundColor: '#FEFFEB',
        borderRadius: 5,
        height: 50,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonLabel: {
        color: 'black',
        fontSize: 16,
        fontWeight: '600',
    },
    dataContainer: {
        flex: 1,
        paddingTop: '2%',
        paddingHorizontal: '5%',
    },
    itemContainer: {
        backgroundColor: '#FEFFEB',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
    },
    itemInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemPrice: {
        fontSize: 14,
        color: 'gray',
    },
    deleteIcon: {
        marginRight: 10,
        marginTop: 10,
        paddingLeft: '40%'
    },
    modalContainer: {
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