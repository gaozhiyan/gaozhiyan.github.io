$(function()
  {
			jsConsole.init();
			$("#enter").click(function(){$("#info").fadeIn("slow");
			$('#container').fadeOut('slow');
			$('#menu').fadeOut('slow');
			});
			$("#ipa").click(function(){$("#info").fadeOut("slow");
			$('#container').fadeIn('slow');
			$('#menu').fadeIn('slow');
			});

			$('#console_window').drags({handle: "#console_systembar"});
			jsConsole.run_cmd("version");
			jsConsole.log("Welcome! type \"help\" to see what commands are available\n");
  });

var jsConsole = 
{
	cmd_list : [],
	cmd_prompt : "$>",
	cmd_history : [],
	cmd_histroy_size: 16,
	cmd_index : -1,	
	
	input_elm : null,
	output_elm : null,
	
	in_buffer : "",
	tmp_buffer : "",
	input_buffer_max : 256,
	
	init : function()
	{
		// save common elements
		this.input_elm = $('#console_input');
		this.output_elm = $('#console_output');
		this.content_elm = $('#console_content');
		
		// bind to global keypress events
		$(document).on('keydown', function(event)
		{
			// the backspace key. prevent default action going back in the browser
			if (event.keyCode === 8)
			{
				jsConsole.handle_key(event);
				return false;
			}
			// the arrow keys are used for going through the command history
			else if (event.keyCode >= 37 && event.keyCode <= 40)
			{	
				jsConsole.handle_key(event);
				return false;
			}
		});
		
		// handle other keys in the keypress event
		$(document).on('keypress', this.handle_key);
		
		// clear the input so the prompt updates
		this.input_clear();
	},
	
	handle_key : function(event)
	{
		if (event.keyCode === 10)
			return;
			
		var self = jsConsole;
			
		if (event.keyCode === 8) // handle backspace
		{
			self.input_log(self.in_buffer.slice(0, self.in_buffer.length-1));
		}
		// enter key pressed. parse then run the command
		else if (event.keyCode === 13)
		{
			// echo the command and clear the input
			var cmd_string = self.in_buffer;
			self.input_clear();
			self.log(self.cmd_prompt + cmd_string);
			
			// reset the history pointer and add the command if it parsed. i.e not empty
			self.cmd_index = -1;
			
			// parse the string to get the command and arguments
			var cmd_obj = self.parse_cmd(cmd_string);
			
			// if th ecommand is not empty, run the command and save the command string to the history
			if (cmd_obj.cmd != "")
			{
				self.run_cmd(cmd_obj.cmd, cmd_obj.args);
				self.add_cmd_history(cmd_string);
			}
		}
		// key up and down. use to move up and down through the history
		else if (event.charCode == 0 && (event.keyCode >= 37 && event.keyCode <= 40)) // arrow keys
		{
			if (event.keyCode === 38)
			{
				if (self.cmd_history.length > 0)
				{
					if (self.cmd_index < self.cmd_history.length-1)
						self.cmd_index++;
					
					self.in_buffer = self.cmd_history[self.cmd_index];
					self.input_log(self.in_buffer);
				}
			}
			else if (event.keyCode === 40) // down key pressed
			{
				if (self.cmd_index > -1)
					self.cmd_index--;
					
				if (self.cmd_index > -1 )
					self.input_log(self.cmd_history[self.cmd_index]);
				else
					self.input_log("");
			}
		}
		else	// handle other characters
		{
			if (self.in_buffer.length < self.input_buffer_max)
				self.input_log(self.in_buffer + String.fromCharCode(event.which));
		}
	},

	// add a new command to the console
	// name: name of the command
	// desc: short description displayed by help command
	// help: detailed help displayed when running help command_name
	// callback: the function to run when the command is run
	// flags: 
	add_cmd : function(name, desc, help, callback, flags)
	{
		// add the command to the command list and sort the commands alphabetically
		this.cmd_list.push({ "name" : name.toLowerCase(), "desc" : desc, "help" : help, "callback" : callback, "flags" : flags});
		
		this.cmd_list.sort(function(a, b)
		{
			return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0);
		});
	},
	
	// return the command object for the specified name
	// returns 0 if the command is not found
	get_cmd : function(cmd_name)
	{
		for (var i =0 ; i< this.cmd_list.length ; i++)
		{
			if (this.cmd_list[i].name === cmd_name)
				return this.cmd_list[i];
		}
		
		return 0;
	},
	
	// parses a string into the command and an array of arguments
	// return object { cmd:"cmd_name", args:[args_array] }
	parse_cmd : function(cmd_string)
	{
		// replace extra whitespace
		var parts = cmd_string.trim().replace(/\s+/g, " ").split(" ");
		var cmd = parts[0];
		var args = parts.length > 1 ? parts.slice(1, parts.length) : [];
		
		return { "cmd" : cmd, "args" : args };
	},
	
	// run the command by calling the command's callback function
	run_cmd : function(cmd, args)
	{
		// find the command
		var cmd_obj = this.get_cmd(cmd);

		if (cmd_obj === 0)
			this.log("Command not recognized : " + cmd + "\n");
		else
		{
			// run the callback if provided
			if (typeof(cmd_obj.callback) === 'function')
				cmd_obj.callback(args);			
		}
	},
	
	// print text to the console buffer
	log : function(str)
	{
		// add the text to the div element and scroll to the top
		this.output_elm.append(str + "\n");
		this.content_elm.scrollTop(10000);
	},
	
	// used to write log text to a temporary buffer
	// this will prevent the log from refreshing after each log command
	// use this if you want to print out lots of log information
	// and flush the buffer when done
	log_buffer : function(str)
	{
		this.tmp_buffer += str;
	},
	
	// this dumps the log buffer to the log output
	buffer_flush : function()
	{
		this.log(this.tmp_buffer);
		this.buffer_clear();
	},
	
	buffer_clear : function()	
	{
		this.tmp_buffer = "";
	},
	
	// clear the output buffer of the console
	log_clear : function()
	{
		this.output_elm.empty();
	},

	// print text to the input buffer
	input_log : function(str)
	{
		this.in_buffer = str;
		this.input_elm.text(this.cmd_prompt + str);
	},		
	
	// clear the input buffer
	input_clear : function()
	{
		this.in_buffer = "";		
		this.input_elm.html(this.cmd_prompt);
	},
	
	// add the command string to the command history
	add_cmd_history : function(str)
	{
		this.cmd_history.unshift(str);
		
		if (this.cmd_history.length >= this.cmd_history_size)
			this.cmd_history.pop();
	},
	
	// reset the command history
	clear_cmd_history : function()
	{
		this.cmd_history = [];
	},
}

jsConsole.add_cmd("help", "provides help information for commands (e.g. help game).", "provides help information for commands\nUsage: HELP [command-name]", cmd_help);

function cmd_help(args)
{
	// if we don't have args, display command list
	if (args.length == 0)
	{
		// going to buffer the commands as an example
		jsConsole.buffer_clear();
		
		jsConsole.log_buffer("For more information on a specific command, type \"help command-name\"\n\n");
		jsConsole.cmd_list.forEach(function(cmd)
		{
			var flags = cmd.flags;
			
			// if the command is not hidden, display the command
			if (typeof(flags) !== "undefined" && flags.hidden === true)
			{
			}
			else
			{
				// write to the temporary buffer
				jsConsole.log_buffer(cmd.name + "\t\t" + cmd.desc + "\n");
			}
		});
		
		// dump the buffer
		jsConsole.buffer_flush();
	}
	// display detailed help for command
	else
	{
		// get the command
		var cmd = jsConsole.get_cmd(args[0]);
		
		// if the command doesn't exist, display error message
		if (cmd === 0)
			jsConsole.log("Could not display help info for specified command : " + args[0] + "\n");
		else
		{
			// if the detailed help is a function, call the function
			if (typeof(cmd.help) === 'function')
				cmd.help();	
			// just print out the string
			else if (typeof(cmd.help) === 'string')
				jsConsole.log(cmd.help);					
		}
	}
}

// the clear command just clears the output text
// will provide a function for the help to show how a help callback works
jsConsole.add_cmd("clear", "clears the command window", cmd_clear_help, function cmd_clear(args)
{
	jsConsole.log_clear();
});

function cmd_clear_help()
{
	jsConsole.log("This detailed help information is printed using a callback function.\n");
}

jsConsole.add_cmd("version", "shows the OS version", "Detailed help information goes here.\n", function cmd_version(args)
{
	jsConsole.log("Zhiyan Gao's personal website\nCopyright (c) 2014 Zhiyan Gao.\n");
});

// print the date
// added some arguments to show how arguments are passed
jsConsole.add_cmd("date", "prints the current date and time", "Usage: date\ndate\t\tprints out the current date\ndate [system]\tprints out the system date\n", function cmd_date(args)
{
	if (args.length > 0 && args[0] == "system")
	{
		var date = new Date(1867,6,11,16,0,0,0);	
		jsConsole.log("System Date: " + date + "\n");
	}
	else
	{
		var date = new Date();
		jsConsole.log("Now Date: " + date + "\n");		
	}
});

// example command
// this will print out a welcome message and the all the arguments
jsConsole.add_cmd("blog", "zhiyan's blog", "Usage: find zhiyan's blog[name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	
	jsConsole.log(  "gaozhiyan.wordpress.com" + arg_string + "\n" + "\n"+ "\n");
});
// who are you
jsConsole.add_cmd("About", "a brief introduction of yours truly", "Usage: who are you [name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	jsConsole.log(  "I am Zhiyan Gao. I am a Phd student in the Linguistics Program at George Mason University." + arg_string + "\n" + "\n");
});
//example command
// Research
jsConsole.add_cmd("rsrch", "what am I doing recently", "Usage: check zhiyan's research [name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	jsConsole.log( "I am currently investigating Mandarin speakers' perception of plosive codas\nand Uyghur speakers' perception of VOTs\n \nI am wholeheartly inviting you to participate in my projects\nnative English speakers are also welcomed." + arg_string + "\n");
});

//example command
// teaching
jsConsole.add_cmd("teach", "handouts and self-study materials for my former students", "Usage: check zhiyan's teaching materials [name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	jsConsole.log( "I taught Mandarin Chinese at Soochow University, the International Center for Language Studies (Washington, DC) and the Business Culture and Language Centre (Falls Church, VA).\nMy teaching materials are in my dropbox" + arg_string + "\n");
});
//example command
// Contact
jsConsole.add_cmd("contact", "ways to contact me", "Usage: contact zhiyan [name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	jsConsole.log( "email:lokigao@hotmail.com\nfacebook:facebook.com/gaozhiyan\n" + arg_string + "\n");
});
//example command
// drag
jsConsole.add_cmd("drag", "move around the console window", "Usage: how to move the console window [name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	jsConsole.log( "The console window is draggable. Put your mouse on the systembar (where the \"minilalist website...\"is), and start dragging " + arg_string + "\n");
});
//example command
// recommd
jsConsole.add_cmd("recommd", "books,TV shows, and Movies", "Usage: stuff I like [name]\n", function(args)
{
	var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});
	
	jsConsole.log("Books:The Federaist Paper, The Prince, Women Fire and Dangerous Things\nMovies:Citizen Kane,12 Angry Men\nTV shows:Yes,Minister! Yes,Prime Minister!,The Big Bang Theory" + arg_string + "\n");
});

// recommd
jsConsole.add_cmd("game", "Play rock-paper-scissors-lizard-Spock with Zhiyan", "\nUsage: words other than \"rock paper scissors\" won\'t work. start every game by typing \"game\"\n\nrules:\n1. scissors cuts paper\n2. paper covers rock\n3. rock crushes lizard\n4. lizard poisons spock\n5. spock smashes scissors\n6. scissors decapitates lizard\n7. lizard eats paper\n8. paper disproves spock\n9. spock vaporizes rock\n10. rock crushes scissors ", function(args)
{
var arg_string = "";
	
	args.forEach( function( value )
	{
		arg_string += " " + value;
	});

	
	var userChoice = prompt("Do you choose rock, paper, scissors, lizard, or spock?").toLowerCase();
var computerChoice = Math.random();
if (computerChoice <= 0.2) {
	computerChoice = "rock";
} else if(0.2<computerChoice <=0.4) {
	computerChoice = "paper";
} else if (0.4<computerChoice <= 0.6){
	computerChoice = "scissors";
}
else if (0.6<computerChoice <= 0.8){
	computerChoice = "lizard";
}
else if (0.8<computerChoice <= 1.0){
	computerChoice = "spock";
}

var compare = function (choice1,choice2){
if(userChoice !== "rock" && userChoice !=="paper"&& userChoice !=="scissors" && userChoice !=="lizard" && userChoice !=="spock"&&userChoice !==""){
     jsConsole.log(userChoice + "？really?! we are playing rock-paper-scissors-lizard-spock here. Be serious. \n(type \"game\" to start over, or \"help game\" for help)"+arg_string +"\n");
     
}
if(choice1==""){jsConsole.log("It looks like you did not choose anything. Type\"game\" to restart, or\"help game\" to find help. ")};
if (choice1=="rock"){
    if (choice2=="scissors"){
    jsConsole.log("I chose scissors. You win." + arg_string + "\n");
    } else if (choice1===choice2){
    jsConsole.log("we all chose rock. it is a tie" + arg_string + "\n");
}
else if (choice2=="paper"){jsConsole.log("I chose paper. I win!" + arg_string + "\n");}
    

else if (choice2=="lizard"){jsConsole.log("I chose lizard. rock crushes lizard. You win!" + arg_string + "\n");}
else {jsConsole.log("I chose spock. spock vaporizes rock. I win!" + arg_string + "\n");}    
}

if (choice1==="paper"){
    if (choice2==="rock"){
    jsConsole.log("I chose rock. You win." + arg_string + "\n");
    } else if (choice1===choice2){
    jsConsole.log("we all chose paper. it is a tie" + arg_string + "\n");
}
else if (choice2="scissors"){jsConsole.log("I chose scissors. I win." + arg_string + "\n");}
else if (choice2="lizard"){jsConsole.log("I chose lizard. lizard eats paper. I win." + arg_string + "\n");}
else {jsConsole.log("I chose spock. paper disproves spock. You win!" + arg_string + "\n");}
}
if (choice1==="scissors"){
    if (choice2==="rock"){
    jsConsole.log("I chose rock. I win." + arg_string + "\n");
    } else if (choice1===choice2){
    jsConsole.log("we all chose scissors. it is a tie" + arg_string + "\n");
}
else if (choice2="spock"){jsConsole.log("I chose spock. spock smashes scissors. I win." + arg_string + "\n");}
else if (choice2="lizard"){jsConsole.log("I chose lizard. scissors decapitate lizard. You win." + arg_string + "\n");}
else jsConsole.log("I chose paper. You win." + arg_string + "\n");

}
if (choice1==="lizard"){
    if (choice2==="rock"){
    jsConsole.log("I chose rock. rock crushes lizard. I win." + arg_string + "\n");
    } else if (choice1===choice2){
    jsConsole.log("we all chose lizard. it is a tie" + arg_string + "\n");
}
else if (choice2="spock"){jsConsole.log("I chose spock. lizard poisons spock. You win." + arg_string + "\n");}
else if (choice2="scissors"){jsConsole.log("I chose scissors. scissors decapitate lizard. I win." + arg_string + "\n");}
else jsConsole.log("I chose paper. lizard eats paper. You win." + arg_string + "\n");

}
if (choice1==="spock"){
    if (choice2==="rock"){
    jsConsole.log("I chose rock. spock vaporizes rock. You win." + arg_string + "\n");
    } else if (choice1===choice2){
    jsConsole.log("we all chose spock. it is a tie" + arg_string + "\n");
}
else if (choice2="scissors"){jsConsole.log("I chose scissors. spock smashes scissors. You win." + arg_string + "\n");}
else if (choice2="lizard"){jsConsole.log("I chose lizard. lizard poisons spock. You win." + arg_string + "\n");}
else jsConsole.log("I chose paper. paper disproves spock. I win." + arg_string + "\n");

}


};
compare (userChoice,computerChoice);
});


