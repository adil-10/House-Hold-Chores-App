import React, { Component } from 'react';
import { Text, TextInput, View, Image, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import firebase from '../config';
import validator from 'validator';

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  //Validate email and pass
  validateEmail = (email) => {
    return validator.isEmail(email);
  }

  validatePassword = (password) => {
    return validator.isStrongPassword(password);
  }

  //Register user
  registerUser = async (firstName, lastName, email, password) => {
    try {
      //send email and pass fields user entered to firebase auth 
      const { user } = await firebase.auth().createUserWithEmailAndPassword(email, password);

      //Create users collection, set fields, user id fields becomes the user id located within firebase auth
      if (user) {
        await firebase.firestore().collection('users')
          .doc(user.uid)
          .set({
            firstName,
            lastName,
            email,
            user_id: user.uid,
          });
        this.showModal('User Created Successfully');
        return;
      }
      else {
        this.showModal('User not created');
        return;
      }
    }
    //Error validation
    catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        this.showModal('Email already in use');
        return;
      }
      else if (error.code === 'auth/weak-password') {
        this.showModal('Password is too weak');
        return;
      }
      else {
        console.log(error.message);
      }
    }
  }

  // Call to validate user input and then register user
  signUp = async () => {
    const { firstName, lastName, email, password, confirmPassword } = this.state;
    this.setState({ modalMessage: '' }); // clear error message
    const isValid = this.validData(); // validate the input data
    if (isValid) {
      try {
        await this.registerUser(firstName, lastName, email, password);
      } catch (error) {
        console.log(error);
      }
    }
  }

  //Validate user input
  validData = () => {
    const { firstName, lastName, email, password, confirmPassword } = this.state;

    // make sure email and password are not empty
    if (firstName == '' || lastName == '' || email == '' || password == '' || confirmPassword == '') {
      this.showModal('Ensure no fields are empty');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showModal('Email invalid format');
      return;
    }

    if (!this.validatePassword(password)) {
      this.showModal('Enter stronger password');
      return;
    }

    if (confirmPassword != password) {
      this.showModal('Passwords must match');
      return;
    }
    return true;
  }

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
          placeholder='Forename'
          onChangeText={firstName => this.setState({ firstName })}
          value={this.state.firstName}
          placeholderTextColor="gray"
        />

        <TextInput style={styles.emailPasswordInput}
          placeholder='Surname'
          onChangeText={lastName => this.setState({ lastName })}
          value={this.state.lastName}
          placeholderTextColor="gray"
        />

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

        <TextInput style={styles.emailPasswordInput}
          placeholder="Confirm Password"
          onChangeText={confirmPassword => this.setState({ confirmPassword })}
          value={this.state.confirmPassword}
          secureTextEntry={true}
          placeholderTextColor="gray"
        />

        <TouchableOpacity style={styles.loginButton}
          onPress={this.signUp}>
          <Text>Sign Up</Text>
        </TouchableOpacity>

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

export default SignUp

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 50,
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
    height: 30,
    marginVertical: '2%',
    paddingHorizontal: 5,
    color: 'black',
  },
  loginButton: {
    marginVertical: 10,
    padding: 10,
    width: 300,
    textAlign: 'center',
    backgroundColor: '#c8ada4',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'black',
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
});
