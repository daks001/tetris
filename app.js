const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20); //defining the dimensions of the canvas

//js object to store the current player's information
const player = {
 matrix : null,
 pos: {x: 0, y: 0},
 score: 0,
};

//the HTML color codes for the tetris blocks
const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

const arena = create_matrix(12, 20); //this is the region in which the blocks will be stacked

let last_time = 0; //the last time a block was dropped
let drop_counter = 0; //number of blocks dropped
let drop_interval = 1000; //interval between the time 2 blocks are dropped

//registering key strokes to define the corresponding actions
document.addEventListener('keydown', event => {
 if(event.keyCode === 37) {
  //left key
  player_move(-1);
 } else if(event.keyCode === 39) {
  //right key
  player_move(1);
 } else if(event.keyCode === 40) {
  //down key
  player_drop();
 } else if(event.keyCode === 81) {
  //q 
  player_rotate(-1);
 } else if(event.keyCode === 87) {
  //w
  player_rotate(1);
 }
});

//clears the bottom row and adds a new one at the top
function arena_sweep() {
 let row_count = 1;
 outer: for(let y = arena.length - 1; y >= 0; y--) {
  for (let x = 0; x < arena[y].length; x++) {
   if (arena[y][x] === 0) {
    continue outer;
   }
  }
  const row = arena.splice(y, 1)[0].fill(0);
  arena.unshift(row);
  ++y;
  player.score += row_count * 10;
  row_count *= 2;
 }
}

//to check if a dropping block is colliding with an existing block or the boundary
function collide(arena, player) {
 const [m, o] = [player.matrix, player.pos];
 for (let y = 0; y < m.length; ++y) {
  for (let x = 0; x < m[y].length; ++x) {
   if (m[y][x] !== 0 && (arena[y+o.y] && arena[y+o.y][x+o.x]) !== 0) {
    return true;
   }
  }
 }
 return false;
}

//creating the different shaped 7 tetris blocks
function create_piece(type) {
 if (type === 'T') {
  return [
   [0, 0, 0],
   [1, 1, 1],
   [0, 1, 0]
  ];
 } else if (type === 'O') {
  return [
   [2, 2],
   [2, 2],
  ];
 } else if (type === 'L') {
  return [
   [0, 3, 0],
   [0, 3, 0],
   [0, 3, 3]
  ];
 } else if (type === 'J') {
  return [
   [0, 4, 0],
   [0, 4, 0],
   [4, 4, 0]
  ];
 } else if (type === 'I') {
  return [
   [0, 5, 0, 0], 
   [0, 5, 0, 0], 
   [0, 5, 0, 0], 
   [0, 5, 0, 0]
  ];
 } else if (type === 'S') {
  return [
   [0, 6, 6], 
   [6, 6, 0], 
   [0, 0, 0]
  ];
 } else if (type === 'Z') {
  return [
   [7, 7, 0], 
   [0, 7, 7], 
   [0, 0, 0]
  ];
 }
}

//function to create an empty matrix filled with 0s
function create_matrix(w, h) {
 const matrix = [];
 while(h--) {
  matrix.push(new Array(w).fill(0));
 }
 return matrix;
}

//draws the canvas on the screen
function draw() {
 context.fillStyle = '#000';
 context.fillRect(0, 0, canvas.width, canvas.height);
 draw_matrix(arena, {x: 0, y: 0});
 draw_matrix(player.matrix, player.pos);
}

//draws the matrix and blocks
function draw_matrix(matrix, offset) {
 matrix.forEach((row, y) => {
  row.forEach((value, x) => {
   if(value !== 0) {
    context.fillStyle = colors[value];
    context.fillRect(x+offset.x, y+offset.y, 1, 1);
   }
  });
 });
}

//to add the player's move to the arena
function merge(arena, player) {
 player.matrix.forEach((row, y) => {
  row.forEach((value, x) => {
   if(value !== 0) {
    arena[y+player.pos.y][x+player.pos.x] = value;
   }
  });
 });
}

//when player drops the block to the bottom
function player_drop() {
 player.pos.y++;
 if (collide(arena, player)) {
  player.pos.y--;
  merge(arena, player);
  player_reset();
  arena_sweep();
  update_score();
 }
 drop_counter = 0;
}

//creates the player's move in the specified direction
function player_move(dir) {
 player.pos.x += dir;
 if (collide(arena, player)) {
  player.pos.x -= dir;
 }
}

//starts (or resets) the game
function player_reset() {
 const pieces = 'ILJOTSZ';
 player.matrix = create_piece(pieces[pieces.length * Math.random() | 0]);
 player.pos.y = 0;
 player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
 if (collide(arena, player)) {
  arena.forEach(row => row.fill(0));
  player.score = 0;
  update_score();
 }
}

//to rotate the tetris blocks in the specified (left or right) direction
function player_rotate(dir) {
 const pos = player.pos.x;
 let offset = 1;
 rotate(player.matrix, dir);
 while (collide(arena, player)) {
  player.pos.x += offset;
  offset = -(offset + (offset > 0 ? 1 : -1));
  if(offset > player.matrix[0].length) {
   player_rotate(player.matrix, -dir);
   player.pos.x = pos;
   return;
  }
 }
}

//rotates the block, passed as a matrix, in the specified direction
function rotate(matrix, dir) {
 for(let y = 0; y < matrix.length; y++) {
  for (let x = 0; x < y; x++) {
   [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
  }
 }
 if (dir>0) {
  matrix.forEach(row => row.reverse());
 }
 else {
  matrix.reverse();
 }
}

//draws the updated matrix after the player has made the move
function update(time = 0) {
 const delta_time = time - last_time;
 last_time = time;
 drop_counter += delta_time;
 if (drop_counter > drop_interval)  {
  player_drop();
 }
 draw();
 requestAnimationFrame(update);
}

//updates the scoreboard
function update_score() {
 document.getElementById("score").innerText = player.score;
}

player_reset();
update_score();
update();