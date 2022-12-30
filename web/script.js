let runs = 0;

let input 
let display_text
let display_text_selected
let output
let output_holder
let error_dot
let time_info
let var_info

let file_menu
let file_list
let file_names = []

let save_menu
let save_name

let current_file = null

// After content is loaded
document.addEventListener('DOMContentLoaded', function(event) {
  input = document.getElementById("input");
  display_text = document.getElementById("display-text");
  display_text_selected = document.getElementById("display-text-selected");
  output = document.getElementById("output");
  output_holder = document.getElementById("output-holder");
  error_dot = document.getElementById("error-dot");
  time_info = document.getElementById("time-info");
  var_info = document.getElementById("var-info");
  file_menu =  document.getElementById("file-menu");
  file_list = document.getElementById("file-list");
  save_menu = document.getElementById("save-menu");
  save_name = document.getElementById("save-name");
  save_dot = document.getElementById("save-dot");

  // Start an update timer to recalc at 10Hz
  let update_timer=setInterval(update, 100);

  // Update text and input box height as text is typed into it
  input.setAttribute("style", "height:" + (input.scrollHeight) + "px;overflow-y:hidden;");
  input.addEventListener("input", function () {
    // Update the display text
    update_display_text();
    update_input_height();
  }, false);  

  // Update display text as the mouse moves (mainly for highlighting)
  input.addEventListener("mousemove", function() {
    update_display_text();
  })
  input.addEventListener("mousedown", function() {
    update_display_text();
  })
  input.addEventListener("mouseup", function() {
    update_display_text();
  })

  // Update the file list
  update_file_list();
  // Focus the input textarea
  input.focus();
})

// Update the display text
// The visual text is made up of three seperate elements
// - Input (syntax highlighted)
// - Highlight (highlight similar selected)
// - Output (green result text)
function update_display_text(){

  // Syntax highlighting!
  input_text = input.value + '\n';
  input_text = input_text.replaceAll(/([=\/\*])/g, "<span class = 'equal'>$1</span>")
  input_text = input_text.replaceAll(/(#.*?\n)/ig, "<span class = 'comment'>$1</span>")
  input_text = input_text.replaceAll(/([0-9]+.[0-9]+|[0-9]+)/ig, "<span class = 'number'>$1</span>")
  display_text.innerHTML = input_text;

  // Selected highlighting
  var start = input.selectionStart;
  var finish = input.selectionEnd;
  var selected_text = input.value.substring(start, finish);
  regex = new RegExp("("+selected_text+")","g");
  display_text_selected.innerHTML = input.value.replaceAll(regex, "<span class = 'highlight'>$1</span>")
}

// Update the height of the input box
function update_input_height(){
  input.style.height = 0;
  input.style.height = (input.scrollHeight) + "px";
}

// Write the calculator output to the output html element
eel.expose(write_output); // Expose this function to Python
function write_output(output_text, error) {
  if(!error){
    // Error dot transparent
    error_dot.style.backgroundColor = "rgb(145, 38, 38, 0)";

    // Set output text value
    output.innerHTML = output_text;
  }else{
    // Error dot red!
    // TODO: Setup a way to view the error trace
    console.log("error");
    error_dot.style.backgroundColor = "rgb(199, 26, 26)";
  }
}

// Set the value of the timer element
eel.expose(set_timer);
function set_timer(time){
  if(time != 0){
    time_info.innerHTML = time.toString() + "ms"
  }
}

// Set the variable number element
eel.expose(set_var_num)
function set_var_num(num){
  var_info.innerHTML = num.toString();
}

// Send input text to python
function update(){
  eel.send_input(input.value);
}

function open_file_picker(){
  update_file_list();

  file_menu.style.display = "block";
}

function close_file_picker(){
  file_menu.style.display = "none";
}

// Opens file
async function open_file(file_path){
  // New file
  // Very Hacky, I dislike this but I've got like 10 mins to finish this feature so there we go
  if(file_path == "> new file"){
    input.value = "";
    output.value = "";
    current_file = null;
    document.title = "new calc";
    input.focus();

  }else{
    current_file = file_path;
    document.title = file_path;

    // Set text area value to be file text
    input.value = await eel.get_file_text(file_path)();
  }

  // Recalculate and update height
  update();
  update_input_height();
  update_display_text();

  // Hide file dialog
  close_file_picker();
}

function open_save_menu(){
  save_menu.style.display = "block";
  save_name.focus()
}

function close_save_menu(){
  save_menu.style.display = "none";
}

// Saves the current file
function save_file(){
  if(current_file == null){
    open_save_menu();
  }else{
    save_dot.classList.remove("flash-animation");
    save_dot.offsetWidth
    eel.save_file_text(current_file, input.value);

    save_dot.classList.add("flash-animation");
  }
}

async function update_file_list(){
  file_template = document.getElementById("file-template");
  
  // Remove existing files
  file_list.innerHTML = "";

  // Get new filenames and add new file
  file_names = await eel.get_file_names()();
  file_names.unshift("> new file");
  
  // Add html elements to represent each file
  for(let file in file_names){
    
    filename = file_names[file];
    new_file = file_template.content.cloneNode(true);
    button = new_file.querySelector('button');
    button.innerHTML = filename;
    
    // Add open file button to each file
    button.addEventListener('click', () => {
      console.log(file_names[file]);
      open_file(file_names[file]);
    })
    
    file_list.appendChild(button);
  }
}


// A window level keypress function to catch shortcuts
function window_key_press(e) {
  var eventObj = window.event? event : e

  // Toggle open dialog with ctrl or cmd + o 
  // Horray for multi-system support
  if (eventObj.key == "o" && (eventObj.ctrlKey || eventObj.metaKey)){
    console.log(file_menu.style.display)
    if(file_menu.style.display == "block"){
      close_file_picker();
    }else{
      open_file_picker();
    }
  }

  // Save file with ctrl or cmd + s
  if (eventObj.key == "s" && (eventObj.ctrlKey || eventObj.metaKey)){
    e.preventDefault();
    save_file();
  }

  // If save menu is open, enter saves the file
  if(save_menu.style.display == "block" && eventObj.key == "Enter"){
    e.preventDefault();
    current_file = save_name.value
    save_file();
    close_save_menu();
  }

  if(eventObj.key == "Escape"){
    close_file_picker();
    close_save_menu();
  }
}
document.onkeydown = window_key_press;