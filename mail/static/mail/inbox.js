document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-page').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  if (document.querySelector('#er')) {
    document.querySelector("#er").remove();
  }
}

function send_email(event) {
  event.preventDefault()

  // Post the values in API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result['error'], result);
    if (result['error']) {
      if (document.querySelector('#er')) {
        document.querySelector("#er").remove();
      }
      const message = document.createElement('div')
      message.className = 'alert alert-danger';
      message.id = 'er'
      message.ariaRoleDescription = 'alert';
      message.innerHTML = `${result['error']}`
      document.querySelector('#compose-view').insertBefore(message, document.querySelector('#compose-form'))
    }
    if (result['message']) {
      const successfully = true
      load_mailbox('sent', successfully)
    }
  })
}

function load_mailbox(mailbox, successfully) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-page').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  if (successfully) {
    const message = document.createElement('div')
    message.className = 'alert alert-success';
    message.ariaRoleDescription = 'alert';
    message.innerHTML = 'Email sent successfully.'
    document.querySelector('#emails-view').appendChild(message)
  }
  // Get the values in API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // For each email create a div and append in emails-view
    emails.forEach(email => {
      const div_email = document.createElement('div');
      div_email.className = email['read'] ? 'readed' : 'unreaded';
      div_email.innerHTML = `
      <b class="sender">${email['sender']}</b>
      <span class="subject" style="margin-left: 8px;" 10px">${email['subject']}</span>
      <span style="color: #8a8a8a; float: right" class="timestamp">${email['timestamp']}</span>
      `;

      // On click in the email, page gonna runs the view_mail function
      div_email.addEventListener('click', function () {
        view_email(email['id'], mailbox)
      });

      // Append div_email on the emails-view div
      document.querySelector('#emails-view').appendChild(div_email)
    })
  });
}

function view_email(email_id, mailbox) {

  // Show the email page and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-page').style.display = 'block';

  // Get the values in API
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email, mailbox)
      // Insert email data in html
      const email_page = document.querySelector('#email-page')
      email_page.innerHTML = `
      <span><b>From:</b> ${email['sender']}</span>
      <br>
      <span><b>To:</b> ${email['recipients']}</span>
      <br>
      <span><b>Subject:</b> ${email['subject']}</span>
      <br>
      <span><b>Timestamp:</b> ${email['timestamp']}</span>
      <br>
      <div id="buttons">
        <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
      </div>
      <hr>
      <span style="white-space: pre-line">${email['body']}</span>
      `;
      if (mailbox === 'inbox') {
        const archive_button = document.createElement('button');
        archive_button.className = 'btn btn-sm btn-outline-secondary';
        archive_button.innerHTML = 'Archive'
        archive_button.id = 'archive';
        buttons.append(archive_button)
        archive_button.addEventListener('click', function() {
          fetch(`/emails/${email['id']}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          .then(response => load_mailbox('inbox'));
        })
      }
      if (mailbox === 'archive') {
        const unarchive_button = document.createElement('button');
        unarchive_button.className = 'btn btn-sm btn-outline-secondary';
        unarchive_button.innerHTML = 'Unarchive'
        unarchive_button.id = 'unarchive';
        buttons.append(unarchive_button)
        unarchive_button.addEventListener('click', function() {
          fetch(`/emails/${email['id']}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
          .then(response => load_mailbox('inbox'));
        })
      }
      // Defining email as read
      fetch(`/emails/${email['id']}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })

      // On click in the button reply, reply_email function it`s gonna run
      document.querySelector('#reply').addEventListener('click', function() {
        reply_email(email)
      })
  });
}

function reply_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-page').style.display = 'none';

  // Set the fields
  document.querySelector('#compose-recipients').value = `${email['sender']}`;
  if(email['subject'].substring(0,3).includes('Re:')) {
    document.querySelector('#compose-subject').value = `${email['subject'].trim()}`;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${email['subject'].trim()}`;
  }
  document.querySelector('#compose-body').value = `

On ${email['timestamp']} ${email['sender']} wrote:
${email['body']}
`
}