function compose_email(reply)
{
	navTriggers(1);
	
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#opened-email').style.display = 'none';
	
	let formerCorrespondence = [];
	if (reply.id != undefined)
	{
		if (reply.body.search("<p hidden>lastReply</p><hr>") !== -1) formerCorrespondence = reply.body.split("<p hidden>lastReply</p><hr>");
		else formerCorrespondence = reply.body.split("<p hidden>lastReply</p>");
		formerCorrespondence[1] = "<i style='color: deepskyblue'>" + reply.timestamp + "</i>" +" • <strong>"+reply.sender+"</strong>:<br>" + formerCorrespondence[1] + "<br>" + "<p hidden>lastReply</p><hr>";
		document.querySelector('#formerCorrespondence').innerHTML = formerCorrespondence[0]+formerCorrespondence[1];
		/*
		let text = formerCorrespondence[1].replaceAll('<strong>','');
		text = text.replaceAll('</strong>','');
		text = text.replaceAll('<br>',"\n")+"\n";*/
		document.querySelector('#compose-recipients').value = reply.sender;
		if (reply.subject.search('re:') === -1 && reply.subject.search('Re:') === -1 ) document.querySelector('#compose-subject').value = "Re: "+ reply.subject;
		else document.querySelector('#compose-subject').value = reply.subject;
		document.querySelector('#compose-body').value = ""; 
	}
	else
	{
		formerCorrespondence[0] = "";
		formerCorrespondence[1] = "<p hidden>lastReply</p>";
		document.querySelector('#formerCorrespondence').style.display = 'none';
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
				body: formerCorrespondence[0]+formerCorrespondence[1]+content.replaceAll('\n','<br>'),
			})
		})
		.then(response => response.json())
		.then(result =>
		{	
   			console.log(result);
   			load_mailbox('sent', true);
    	});
    	return false;
   	}
}

function navTriggers(index)
{
	navButtons = document.getElementsByClassName('navButton');
	for (const trigger of navButtons) 
	{
		trigger.style['background-color'] = null;
		trigger.style.border = null;
		trigger.style.color = null;
	}
	navButtons[index].style['background-color'] = 'white';
	navButtons[index].style.border = '2px solid white';
	navButtons[index].style.color = 'deepskyblue';
	// using null allows the CSS styling to be back in place, like hover effects. If I would manually set styling here in JS with hte same attributes of select and non-select states as in CSS, the hover effects would be overwritten with static styling, as JS-set styling has precedence over CSS styling. So best to remove JS-set styling to allow CSS to work again.
}

function load_mailbox(mailbox, secondPara)
{
	if(typeof(mailbox) != "number")
	{
		let buttonIndex = 0;
		if (mailbox === 'sent') buttonIndex = 2;
		else if (mailbox === 'archive') buttonIndex = 3;
		navTriggers(buttonIndex);
	}

	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#opened-email').style.display = 'none';
	  
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
			let archive;
			if (secondPara !== undefined)
			{
				archive = document.createElement('button');
				archive.classList.add("archiveButton");
				if (email.archived == false) archive.innerHTML = 'Archive';
				else
				{
					archive.classList.add("archivedButton");
					archive.innerHTML = 'Un-Archive';
				}
				archive.addEventListener('click', ()=>
				{
					if (email.archived == true)
					{
		   				fetch(`/emails/${mailbox}`,
						{
							method: 'PUT',
							body: JSON.stringify
							({archived: false})
						})
						.then(response =>
						{
							console.log(response);
							archive.innerHTML = 'Done!';
							setTimeout(()=>
			    			{
								return load_mailbox('inbox');
							},500);
						});
					}
					else
					{
						fetch(`/emails/${mailbox}`,
						{
							method: 'PUT',
							body: JSON.stringify
							({archived: true})
						})
						.then(response =>
						{
							console.log(response);
							archive.innerHTML = 'Done!';
							setTimeout(()=>
			    			{
								return load_mailbox('inbox');
							},500);
						});
					}
				});
			}
			
			let mailContent = document.createElement('div');
			let top = document.createElement('div');
			let body = document.createElement('div');
			let hr = document.createElement('hr');
			let reply = document.createElement('button');
			mailContent.classList.add("openedMail");
			reply.classList.add("archiveButton","reply");
			reply.innerHTML = "Reply";
			top.innerHTML = "On " + email.timestamp + "<br>From: " + email.sender + "<br>To: " + email.recipients +"<br>Topic: "  + email.subject;
			body.innerHTML = email.body;
			mailContent.appendChild(top);
			if (secondPara !== undefined) mailContent.appendChild(archive);
			mailContent.appendChild(reply);
			mailContent.appendChild(hr);
			mailContent.appendChild(body);
			document.querySelector('#opened-email').append(mailContent);
   			reply.addEventListener('click', ()=> {compose_email(email)});
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
			 	if (mailbox !== 'sent') inboxElement.addEventListener('click', () => {load_mailbox(emails[x].id, true)}, false);
			 	else inboxElement.addEventListener('click', () => {load_mailbox(emails[x].id)}, false);
			 	if (emails[x].read) inboxElement.classList.add("alreadyRead");
			  	document.querySelector('#emails-view').append(inboxElement);
			  	if (secondPara !== undefined && x === 0)
		  		{
		  			inboxElement.animate([{backgroundColor: 'orange'},{backgroundColor: '#6697B2'}],2000);
		  		}
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