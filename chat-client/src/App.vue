<script setup>
import {io} from 'socket.io-client';
import { onBeforeMount, ref } from 'vue';

const socket = io('http://localhost:3001');

const messages = ref([]);
const messageText = ref('');
const joined = ref(false);
const name = ref('');
const typingDisplay = ref('');
const chatName = ref('');
const password = ref('');
const createChatName = ref('');
const createChatPassword = ref('');


onBeforeMount( () => {
  // socket.emit('findAllChannelMessages', {chatName: chatName.value, password: password.value}, (response) => {
  //   messages.value = response;
  // });

  socket.on('message', (message) => {
    messages.value.push(message);
  });

  socket.on('typing', ({name, isTyping})  => {
    if (isTyping){
      typingDisplay.value = `${name} is typing...`;
    } else {
      typingDisplay.value = '';
    }
  });
});

const join = () => {
  console.log("try to join");
  socket.emit('join', { name: name.value, chatName: chatName.value, password: password.value}, () => {
    joined.value = true;
    console.log("joined");
  })

  socket.emit('findAllChannelMessages', {chatName: chatName.value, password: password.value}, (response) => {
    messages.value = response;
  });
}

const createChannel = () => {
  socket.emit('createChannel', { name: name.value, createChatName: createChatName.value, createChatPassword: createChatPassword.value}, () => {
  });
};


const sendMessage = () => {
  socket.emit('createMessageChannel', { text: messageText.value, chatName: chatName.value, password: password.value}, () => {
    messageText.value = '';
  })

}

let timeout;
const emitTyping = () => {
  socket.emit('typing', {isTyping: true});

  timeout = setTimeout( () => {
    socket.emit('typing', {isTyping: false});
  }, 2000);
}

</script>

<template>
  <div class="chat">
    <div v-if="!joined">
      <form @submit.prevent="join">
        <label>What's your name?</label>
        <input v-model="name"/>
        <label>Chat name:</label>
        <input v-model="chatName" />
        <label>Chat password:</label>
        <input v-model="password" type="password" />
        <button type="submit">join room</button>
      </form>
      <form @submit.prevent="createChannel">
        <label>Create a channel (name) :</label>
        <input v-model="createChatName" />
        <label>Create a channel (pass) :</label>
        <input v-model="createChatPassword" type="password"/>
        <button type="submit">Create room</button>
      </form>
    </div>
    <div class="chat-container" v-else>
      <div class="messages-container">
        <div v-for="message in messages">
          [{{ message.name }}]: {{ message.text }}
        </div>
      </div>

      <div v-if="typingDisplay">{{ typingDisplay }}</div>

      <hr />
      <div class="message-input">
        <form @submit.prevent="sendMessage">
          <label>Message:</label>
          <input v-model="messageText" @input="emitTyping" />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
@import './assets/base.css';

.chat {
  padding: 20px;
  height: 100vh;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
}

.join-section, .create-section {
  margin-bottom: 20px;
}

.name-input {
  margin-bottom: 10px;
}

h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

form {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 5px;
}

input[type="text"], input[type="password"] {
  margin-bottom: 10px;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
}

button[type="submit"] {
  margin-top: 10px;
}

</style>
