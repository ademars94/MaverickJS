#Maverick 2D
**A live multiplayer aerial combat game in your browser**

![Maverick 2D](http://i.imgur.com/e5hO3QZ.png)

###Tech
- HTML5 Canvas
- Javascript
- jQuery
- Node.js
- Express.js
- socket.io

###Gameplay
Players start off in the center of the map, flying forward at a constant speed.  The map scrolls underneath the player as they fly along.  Using the arrow keys and shift, players are able to navigate around the map and hunt each other down!  There are four planes to choose from for now.


###Links
- [Hosted on Heroku](http://maverick-2d.herokuapp.com/)
- [Trello](https://trello.com/b/uxBp97AD/maverick-2d)


###Architecture
Maverick 2D uses socket.io and Node.js to create a game server, which listens for new players. Express.js routes the client to a simple html page, which contains the game canvas and the client side javascript.  The game logic on the client side is responsible for rendering the canvas and detecting player input.  Player input is sent off to the socket server where the movement of each player is processed.  The server takes in any new player input, changes those players' positions, checks to see if there are any collisions, and sends all of that data back to the client to be rendered.

###Known Issues
- Username can contain an unlimited number of characters.
- Canvas continues to draw the grid off of the right and bottom sides.
- Respawn currently requires the user to reload the page.

