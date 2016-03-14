#Maverick 2D
**A live multiplayer aerial combat game in your browser**

![Maverick 2D](http://i.imgur.com/61kHKrf.png =720x)

#[Play Maverick 2D](http://maverick-2d.herokuapp.com/)

##Gameplay
Enter your name, select a plane, and head into battle! Control your plane with the arrow keys or A, W, and D. Left and right to turn, and up to accelerate. Fly around the virtual map collecting weapons and hunting down enemies. When an enemy's plane comes into view, it's your job to shoot them down.  Press space to fire bullets, shift to reload, 1 to fire missiles, and 2 to fire homing missiles, which track down the closest enemy.  Your plane can turn tighter than a homing missile can, so try to outmaneuver them if you can.  You can also shoot homing missiles out of the sky! There are six planes to choose from for now.

<br>

![Maverick 2D](https://i.imgur.com/xrReLmu.png =720x)

<br>
![](http://i.imgur.com/VE1ilXA.png)
<br>

##How does it work?

#####Basics
Maverick 2D uses Socket.io, a WebSocket technology, to create the server, which "listens" for new players.  When a new player joins, their data is passed through a constructor function and they are pushed into an array of player objects in the server.  This array is sent back to every client at a set interval.  If an enemy plane's position is within the boundaries of a client's viewport, the enemy plane will be drawn.  Socket.io allows all of this to happen in real time.
#####Client-Server Communication
The client-side logic contains event listeners that are waiting for keydown and keyup events.  When a player presses a key, the player's data is sent via Socket.io to the server.  The server looks through all of the players to find the one who pressed a key, and updates that player's data accordingly.  Since the array of player objects is constantly being sent back to all clients, the update is reflected on everyone's game canvas.  If a player presses the shift key, their current position and angle is used in a bullet constructor function to create a new bullet.  The leaderboard is sorted by points, and is updated at a set interval on every client's canvas.
#####Canvas
The scrolling map is one of the most important features of Maverick 2D.  Each client has a viewport, which is sized to the canvas dimensions.  The viewport is used to create a "camera" in the client side logic.  This camera follows the player as they move around the 5000-pixel square that makes up the map.  The camera's top and left boundaries are tracked and used to determine which section of the map to draw.  These values are also used to determine if and where to draw the enemy planes.
#####Collision Detection
To keep the players within the map, their X and Y values are monitored by the server.  If the player's position meets the boundaries of the map, their progress in that direction is halted.  If a bullet's X and Y values fall within the 64-pixel box surrounding a plane, that plane's health is decreased by 1 point.
#####Homing Missile Logic
Using Pythagorean theorem, the missile checks the distance between itself and all other players on the map. This data is used to select a player and "focus" the missile on them. Using the X and Y values of the player and the missile, along with their respective angles, Maverick 2D uses an angle-correction algorithm to send the missile toward the player it's tracking.
#####Design
The map and planes are all created as PNG images in Photoshop.  The menu screen is styled with basic CSS.  I am keeping the design somewhat minimalist, to match the simple UI of the game.
<br>
<br>

*Canvas resizes to your browser's window*

![Maverick 2D](http://i.imgur.com/YBHS8q6.png =720x)

![](http://i.imgur.com/XWZpWwd.png =720x)

###Coming Soon
- Game lobbies, capping the number of users that can connect at once
- Team battles, differing game modes
- Collect bombs as they randomly spawn throughout the map and deal 5x damage
- Collision detection between planes
- More planes to choose from
- Facebook integration
- Persistent NoSQL database to hold player information

###Known Issues
- Username can contain an unlimited number of characters.
- Respawn currently requires the user to reload the page.
- Lag can become a problem if a player has a slow connection
