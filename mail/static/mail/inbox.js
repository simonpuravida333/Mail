function compose_email(reply) {

	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#opened-email').style.display = 'none';
	
	if (reply.id != undefined)
	{
		document.querySelector('#compose-recipients').value = reply.sender;
		document.querySelector('#compose-subject').value = "Re: "+ reply.subject;
		document.querySelector('#compose-body').value = "On " + reply.timestamp + " wrote:\n\n" + reply.body;
	}
	else
	{
		document.querySelector('#compose-recipients').value = '';
		document.querySelector('#compose-subject').value = '';
		document.querySelector('#compose-body').value = '';
	}
	
    document.querySelector('form').onsubmit = () =>
    {
    	let sendTo = document.querySelector('#compose-recipients').value;
		let topic = document.querySelector('#compose-subject').value;
		let content = document.querySelector('#compose-body').value;
		
    	fetch('/emails',
    	{
			method: 'POST',
			body: JSON.stringify
			({
				recipients: sendTo,
				subject: topic,
				body: content,
			})
		})
		.then(response => response.json())
		.then(result =>
		{	
   			console.log(result)
    	});
    	load_mailbox('sent');
    	return false;
   	}
}


function load_mailbox(mailbox)
{
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#opened-email').style.display = 'none';
	// Show the mailbox name
	//document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
	  
	if(typeof(mailbox) == "number")
	{
		document.querySelector('#emails-view').style.display = 'none';
		document.querySelector('#opened-email').style.display = 'block';
		document.querySelector('#opened-email').innerHTML = "";
		fetch(`/emails/${mailbox}`,
		{
			method: 'PUT',
			body: JSON.stringify
			({
	  			read: true
			})
		})
		fetch(`/emails/${mailbox}`)
		.then(response => response.json())
		.then(email =>
		{	
			let mailContent = document.createElement('div');
			let top = document.createElement('div');
			let body = document.createElement('div');
			let hr = document.createElement('hr');
			let archive = document.createElement('button');
			let reply = document.createElement('button');
			mailContent.classList.add("openedMail");
			top.classList.add("mailTop");
			body.classList.add("mailBody");
			archive.classList.add("archiveButton");
			reply.classList.add("archiveButton","reply");
			reply.innerHTML = "Reply";
			
			if (email.archived == false)
			{
				archive.innerHTML = 'Archive';
			}
			else
			{
				archive.classList.add("archivedButton");
				archive.innerHTML = 'Un-Archive';
			}
			
			top.innerHTML = "On " + email.timestamp + "<br>From: " + email.sender + "<br>To: " + email.recipients +"<br>Topic: "  + email.subject;
			body.innerHTML = email.body;
			mailContent.appendChild(top);
			mailContent.appendChild(archive);
			mailContent.appendChild(reply);
			mailContent.appendChild(hr);
			mailContent.appendChild(body);
			document.querySelector('#opened-email').append(mailContent);
			
			archive.addEventListener('click', function()
			{
				if (email.archived == true)
				{
	   				fetch(`/emails/${mailbox}`,
					{
						method: 'PUT',
						body: JSON.stringify
						({archived: false})
					})
				}
				else
				{
					fetch(`/emails/${mailbox}`,
					{
						method: 'PUT',
						body: JSON.stringify
						({archived: true})
					})
				}
				archive.innerHTML = 'Done!';
				setTimeout(function () 
    			{
					return load_mailbox('inbox');
				},500); // allows the server to be faster than the client, otherwise the redirection to inbox is too quick, and you'd have to refresh again. Also it gives it a better feel: with a little bit of delay after clicking, it feels more like you have clicked it (with some CSS).
   			})
   			reply.addEventListener('click', function()
			{
				compose_email(email);
			})
		})
	}
	else
	{
	  	document.querySelector('#emails-view').innerHTML = "";
	  	fetch(`/emails/${mailbox}`)
		.then(response => response.json())
		.then(emails => 
		{
			for(let x = 0; x < emails.length; x++)
	    	{
			  	let inboxElement = document.createElement('div');
			  	let rightChild = document.createElement('div');
			 	let leftChild = document.createElement('div');
			 	inboxElement.classList.add("inboxElement");
			 	rightChild.classList.add("inboxElementRightSide");
			 	leftChild.classList.add("inboxElementLeftSide");
			 	leftChild.innerHTML = "From: "+emails[x].sender + " • " + emails[x].subject;
			 	rightChild.innerHTML = emails[x].timestamp;
			 	inboxElement.appendChild(leftChild);
			 	inboxElement.appendChild(rightChild);
			 	inboxElement.addEventListener('click', () => {load_mailbox(emails[x].id)}, false);
			 	if (emails[x].read) inboxElement.classList.add("alreadyRead");
			  	document.querySelector('#emails-view').append(inboxElement);
	  		}
		});
	}
}

document.addEventListener('DOMContentLoaded', function() {

  	// Use buttons to toggle between views
  	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  	document.querySelector('#compose').addEventListener('click', compose_email);
	load_mailbox('inbox');
});