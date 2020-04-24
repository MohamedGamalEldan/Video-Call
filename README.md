# Video Call By WebRTC & Socket.io

# Before Installation
##### If you want run the app on LAN you can do it.
- Add the app to whiltelist
open [chrome://flags ](chrome://flags) and search for ```unsafely-treat-insecure-origin-as-secure``` and add URL ex. (http://192.168.1.2:4000)
- Open public/scripts/script.js
at line 164 change localhost to your local IP (Server's IP)

``` 
// Socket //
const socket = io.connect("localhost:4000"); 
```

# Installation

```
$ npm i --save
$ npm run start
```

###### I used this repo to build my app https://github.com/Miczeq22/simple-chat-app
