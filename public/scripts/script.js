let isWebCamStreaming = false;
let isMacWorking = false;
let streamTracks = null;
let socketIdUser = null;
let isAlreadyCalling = false;
let getCalled = false;

const peerConnection = new RTCPeerConnection();

$("#btn-local-video").click(function (el) { 

    if(isWebCamStreaming){
      peerConnection.getSenders().forEach(function(sender){
        streamTracks.getVideoTracks().forEach(function(track){
          if(track == sender.track){
            track.stop();
            peerConnection.removeTrack(sender);
          }
        })
      });

      document.getElementById("local-video").srcObject = null;
      isWebCamStreaming = false;
    }else{
      isWebCamStreaming = true;
      getUserMedia();
      
    }

});

$("#btn-local-audio").click(function (el) { 

  if(isMacWorking){
    peerConnection.getSenders().forEach(function(sender){
      streamTracks.getAudioTracks().forEach(function(track){
        if(track == sender.track){
          track.stop();
          peerConnection.removeTrack(sender);
        }
      })
    });

    isMacWorking = false;
    $("#btn-local-audio i").attr('class','fa fa-volume-off');
  }else{
    isMacWorking = true;
    getUserMedia(true);
  }

});

function getUserMedia(audio = false){

  if(streamTracks){ //stop old tracks
    peerConnection.getSenders().forEach(function(sender){
      streamTracks.getTracks().forEach(function(track){
        if(track == sender.track){
          track.stop();
          peerConnection.removeTrack(sender);
        }
      })
    });
  }

  navigator.getUserMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);
  
  navigator.getUserMedia(
  {
    video: isWebCamStreaming,
    audio: isMacWorking
  },
  stream => {

    if(audio){
      $("#btn-local-audio i").attr('class','fa fa-volume-up');
    }

    document.getElementById("local-video").srcObject = stream;
    streamTracks = stream;

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    if(isAlreadyCalling){
      updateCall(socketIdUser)
    }
  },
  error => {
    alert("Error: " + error.name);
  }
  );
}


function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );

  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");

  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });

  return userContainerEl;
}

async function callUser(socketId) {
  const callOffer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(callOffer));

  socket.emit("call-user", {
    callOffer,
    to: socketId
  });
}

async function updateCall(socketId) {
  const callOffer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(callOffer));

  socket.emit("update-calling", {
    callOffer,
    to: socketId
  });
}

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);

      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

// Socket //
const socket = io.connect("localhost:4000");

socket.on("update-user-list", ({ users }) => {
  updateUserList(users);
});

socket.on("start-call", async data => {
  if (getCalled) {
    const confirmed = confirm(
      `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
    );

    if (!confirmed) {
      socket.emit("reject-call", {
        from: data.socket
      });
      return;
    }
  }

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer,
    to: data.socket
  });
  getCalled = true;
  socketIdUser = data.socket;
  isAlreadyCalling = true;
  document.getElementById(data.socket).setAttribute("class", "active-user active-user--selected");
});

socket.on("update-call", async data => {

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer,
    to: data.socket
  });

});

socket.on("answer-made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
  
  if (!isAlreadyCalling) {
    callUser(data.socket);
    socketIdUser = data.socket;
    isAlreadyCalling = true;
  }
});

socket.on("call-rejected", data => {
  alert(`User: "Socket: ${data.socket}" rejected your call.`);
  unselectUsersFromList();
});

peerConnection.ontrack = function({ streams: [stream] }) {
  document.getElementById("remote-video").srcObject = stream;
};

socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);
  if (elToRemove) {
    elToRemove.remove();
  }
  if(socketId == socketIdUser){
    document.getElementById("remote-video").srcObject = null;
    isAlreadyCalling = false;
  }
});