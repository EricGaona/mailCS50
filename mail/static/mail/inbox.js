document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

//  --------  >>>>>>>>      Starting code added by ME inside the function compose_email
// Add submit event for sending email
document.querySelector('#compose-form').onsubmit = () => {
  const recipients = document.querySelector('#compose-recipients').value.trim();
  const subject = document.querySelector('#compose-subject').value.trim();
  const body = document.querySelector('#compose-body').value.trim();

  // POST email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then(response => response.json())
    .then(result => {
      //console.log(result); // Log the server response
      if(result.error){
        alert(`Error: ${result.error}`);
      }else{
        console.log(result);
        load_mailbox('sent');
      }
      // Load sent mailbox after sending email
      //console.log(result);
      //load_mailbox('sent');
    });

  return false; // Prevent form from submitting traditionally
  //  ------- >>>>>>> End added by me inside the function compose_email
};
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  console.log(`Soy el parametro --- >>> ${mailbox}`)

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 class="border-bottom">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //  --------  >>>>>>>>      Start added by ME inside the function load_mailbox
  // Fetch emails for the mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(emails);
      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        emailDiv.style.cursor = "pointer";
        emailDiv.className = `email-item d-flex justify-content-between border-bottom mb-2  ${email.read ? 'bg-secondary text-white' : 'bg-white'}`;
        emailDiv.innerHTML = `
          <span><strong>${mailbox === 'sent' ? email.recipients.join(', ') : email.sender}</strong></span>
          <span>${email.subject}</span>
          <span>${email.timestamp}</span>
        `;
        emailDiv.addEventListener('click', () => view_email(email.id, mailbox));
        document.querySelector('#emails-view').append(emailDiv);

        //  --------- >>>>>> adding the button archive 
        if (mailbox !== 'sent') {
          const archiveButton = document.createElement('button');
          archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive';
          archiveButton.className = 'btn btn-sm btn-primary';
          archiveButton.addEventListener('click', (event) => {
            event.stopPropagation();
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({ archived: !email.archived }),
            }).then(() => load_mailbox('inbox'));
          });
          emailDiv.append(archiveButton);
        }
      });
    });
      //  ------- >>>>>>> End added by me inside the function load_mailbox
}

// ------------->>>>>>>>>>>>>>
function view_email(email_id, mailbox) {
  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  // Fetch email details
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      console.log(email);
      const emailView = document.querySelector('#email-view');
      emailView.innerHTML = `
        <h4>${email.subject}</h4>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr>
        <p>${email.body}</p>
      `;
      // Mark email as read
      if (!email.read) {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true }),
        });
      }
      // Archive/Unarchive button
      if (mailbox !== 'sent') {
        const archiveButton = document.createElement('button');
        archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive';
        archiveButton.className = 'btn btn-sm btn-outline-primary';
        archiveButton.addEventListener('click', () => {
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: !email.archived }),
          }).then(() => load_mailbox('inbox'));
        });
        emailView.append(archiveButton);
      }
      // Reply button
      const replyButton = document.createElement('button');
      replyButton.textContent = 'Reply';
      replyButton.className = 'btn btn-sm btn-outline-secondary';
      replyButton.addEventListener('click', () => reply_email(email));
      emailView.append(replyButton);
    });
}

function reply_email(email) {
  // Show compose view and hide other views
 compose_email();   //--- >>> HE COMENTODO ESTA LINEA -- PREGUNTAR A EDUARDO
                    // sin esta linea el boton de Reply no funciona

  // Pre-fill the composition form
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value =
    email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `
On ${email.timestamp}, ${email.sender} wrote:
${email.body}
  `;
}

