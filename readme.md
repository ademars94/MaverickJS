#Maverick 2D
**A live multiplayer aerial combat game in your browser**

![Maverick 2D](https://i.imgur.com/FeKMzzA.png)

###Tech
- HTML5 Canvas
- Javascript
- jQuery
- Node.js
- Express.js
- socket.io

###Architecture
Maverick 2D uses socket.io and Node.js to create a game server, which listens for new players. Express.js routes the client to a simple html page, which contains the game canvas and the client side javascript.  The game logic on the client side is responsible for rendering the canvas and detecting player input.  Player input is sent off to the socket server where the movement of each player is processed.  The server takes in any new player input, changes those players' positions, checks to see if there are any collisions, and sends all of that data back to the client to be rendered.

![Maverick 2D](https://i.imgur.com/cLqmLRn.png)
