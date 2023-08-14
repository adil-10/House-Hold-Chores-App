import React, { Component } from 'react';
import { Text, SafeAreaView, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import firebase from '../config';
import validator from 'validator';

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            email: '',
            user: null,
            users: [],
            loading: true,
            error: null,
            isModalVisible: false,
            modalMessage: ''
        };
    }
    componentDidMount() {
        this.getInfo();
    }
    //Toggle modal open or close
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

    //validate email
    validateEmail = (email) => {
        return validator.isEmail(email);
    }

    getInfo = async () => {
        const user = firebase.auth().currentUser.uid;
        //check if user is authenticated and logged in
        if (!user) {
            this.showModal('User is not authenticated');
            return;
        }
        //If user is set states of first,last name and email, later rendered
        const userRef = firebase.firestore().collection('users').doc(user);
        const snapshot = await userRef.get();
        const userData = snapshot.data();
        this.setState({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email
        });
    };

    updateInfo = async () => {
        //check if user is logged in
        const user = firebase.auth().currentUser.uid;
        if (!user) {
            this.showModal('User is not authenticated');
            return;
        }


        // Check if firstName, lastName and email are not empty
        if (!this.state.firstName || !this.state.lastName || !this.state.email) {
            this.showModal('Ensure no fields are empty');
            return;
        }

        // Check if the email is valid
        if (!this.validateEmail(this.state.email)) {
            this.showModal('Email invalid format');
            return;
        }
        //If validations complete and are okay, then allow users input to be set as the new states of firstname, lastname or email
        firebase
            .firestore()
            .collection('users')
            .doc(firebase.auth().currentUser.uid)
            .update({
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                email: this.state.email,
            })
            .then(() => {
                this.showModal('Update Complete');
                return;
            })
            .catch((error) => {
                console.log(error);
                this.showModal('Error updating user data');
                return;
            });
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

                <View style={{
                    paddingTop: '50%',
                    paddingHorizontal: '5%'
                }}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="First Name"
                        placeholderTextColor="gray"
                        onChangeText={(text) => this.setState({ firstName: text })}
                        value={this.state.firstName}
                    />

                    <TextInput
                        style={styles.inputBox}
                        placeholder="Last Name"
                        placeholderTextColor="gray"
                        onChangeText={(text) => this.setState({ lastName: text })}
                        value={this.state.lastName}
                    />

                    <TextInput style={styles.inputBox}
                        placeholder="Email"
                        placeholderTextColor="gray"
                        onChangeText={(text) => this.setState({ email: text })}
                        value={this.state.email}
                    />
                    <View>
                        <TouchableOpacity style={styles.buttonDesign} onPress={() => this.updateInfo()}>
                            <Text style={styles.buttonDesignText}>Update</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.buttonDesign}
                            onPress={() => {
                                firebase
                                    .auth()
                                    .signOut()
                                    .then(() => {
                                        console.log('Logout successful');
                                    })
                                    .catch((error) => {
                                        this.setState({
                                            isModalVisible: true,
                                            modalMessage: 'Logout failed', error,
                                        });
                                        setTimeout(() => {
                                            this.setState({ isModalVisible: false });
                                        }, 2000);
                                    });
                            }}>
                            <Text style={styles.buttonDesignText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
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

export default Profile;

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
    inputBox: {
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 5,
        width: '100%',
        height: 50,
        marginTop: 10,
        fontSize: 16,
    },
    buttonDesign: {
        marginVertical: 10,
        padding: 10,
        width: '75%',
        textAlign: 'center',
        justifyContent: 'center',
        backgroundColor: '#c8ada4',
        borderColor: 'black',
        backgroundColor: '#c8ada4',
        padding: 10,
        borderRadius: 5,
        width: '100%',
    },
    buttonDesignText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
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
    },
})


