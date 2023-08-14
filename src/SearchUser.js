import React, { Component } from 'react';
import { Text, TextInput, View, Button, Alert, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebase from '../config';
import * as MailComposer from 'expo-mail-composer';
import { Linking } from 'react-native';

export default class SearchUser extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchQuery: '',
            searchResults: [],
            isAvailable: false
        };
    }

    componentDidMount() {
        this.checkIsAvailablity();
    }

    checkIsAvailablity = async () => {
        const isMailAvailable = await MailComposer.isAvailableAsync();
        this.setState({ isAvailable: isMailAvailable });
    }

    searchUsers = async () => {
        const query = this.state.searchQuery.toLowerCase();
        const results = [];
        const snapshot = await firebase.firestore().collection('users').get();
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (
                data.firstName.includes(query) ||
                data.lastName.includes(query) ||
                data.email.includes(query)
            ) {
                results.push(data);
            }
        });
        this.setState({ searchResults: results });
    };

    sendEmail = (email, userId) => {
        const roomId = this.props.route.params.id;
        const roomUrl = this.props.route.params.roomUrl;
        const urlWithRoomId = `${roomUrl}/JoinRoom?roomId=${roomId}&userId=${userId}`;
        console.log("Sending email to:", email, "with URL:", urlWithRoomId);

        MailComposer.composeAsync({
            subject: "Join My Room",
            body: "Here's the room URL: " + urlWithRoomId,
            recipients: [email],
        });
    }




    render() {
        const roomUrl = this.props.route.params;
        // console.log(roomUrl)
        return (
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Search for a user"
                    onChangeText={(text) => this.setState({ searchQuery: text })}
                />
                <Button title="Search" onPress={this.searchUsers} />
                <FlatList
                    data={this.state.searchResults}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => this.sendEmail(item.email, item.user_id)}>
                            <Text>{item.firstName} {item.lastName}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    }
}

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
});
