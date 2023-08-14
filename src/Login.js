import React, { Component } from 'react';
import { Text, TextInput, View, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import firebase from '../config';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
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

  //validate user inputed data, if user existssign user in, navigate to homepage
  loginUser = async (email, password) => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // login successful, proceed to next screen
      navigation.navigate('HomePage');
    }
    catch (error) {
      // handle login errors
      if (error.code === "auth/invalid-email") {
        this.showModal('Invalid email address');
        return;
      }
      else if (error.code === "auth/user-disabled") {
        this.showModal('IUser account has been disabled');
        return;
      }
      else if (error.code === "auth/user-not-found") {
        this.showModal('User not found');
        return;
      }
      else if (error.code === "auth/wrong-password") {
        this.showModal('Incorrect password');
        return;
      }
      else {
        this.showModal('Login failed. Please try again later');
        return;
      }
    }
  }

  //Call to method to validate data and login user
  login = () => {
    const isValid = this.validData(); // validate the input data
    if (isValid) {
      const { email, password } = this.state;
      this.loginUser(email, password);
    }
  }

  //validation of user input
  validData = () => {

    const { email, password } = this.state;

    // make sure email and password isnt empty
    if (email == "" || password == "") {
      this.showModal('Ensure no fields are empty');
      return;
    }

    if (typeof email != "string" || typeof password != "string") {
      this.showModal('Enter valid characters');
      return;
    }
    return true;
  }

  //what user sees
  render() {
    const navigation = this.props.navigation;
    return (
      <View style={styles.container}>
        <Image source={require('/Users/adilbadat/Documents/MobileApp/House-Hold-Chores/House-Hold-App/assets/BackgroundNew.jpg')} style={{
          position: 'absolute',
          zIndex: -1,
          width: '100%',
          height: '100%',
          opacity: 0.5,
        }} />

        <Text style={styles.title} >Chores DO IT</Text>

        <TextInput style={styles.emailPasswordInput}
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
          placeholderTextColor="gray"
        />

        <TextInput style={styles.emailPasswordInput}
          placeholder="Password"
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
          secureTextEntry={true}
          placeholderTextColor="gray"
        />

        <TouchableOpacity style={styles.loginButton}
          onPress={this.login}>
          <Text>log in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('SignUp')}>
          <Text>Create Account</Text>
        </TouchableOpacity>

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

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    color: 'black',
    fontSize: 50,
    fontWeight: 'bold',
    marginVertical: '5%',
  },
  emailPasswordInput: {
    borderWidth: 1,
    borderColor: 'gray',
    width: '100%',
    height: 50,
    marginVertical: '2%',
    paddingHorizontal: 5,
    color: 'black',
  },

  loginButton: {
    marginVertical: 10,
    padding: 10,
    width: '75%',
    textAlign: 'center',
    justifyContent: 'center',
    backgroundColor: '#c8ada4',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'black',
  },
  createButton: {
    marginVertical: 10,
    padding: 10,
    width: '75%',
    textAlign: 'center',
    justifyContent: 'center',
    backgroundColor: '#c8ada4',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'black',
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
});