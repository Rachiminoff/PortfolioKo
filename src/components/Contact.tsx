import React, { useState } from 'react';
import '../assets/styles/Contact.scss';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';

import SendIcon from '@mui/icons-material/Send';

import emailjs from '@emailjs/browser';
import axios from 'axios';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [error, setError] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sendError, setSendError] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const getBrowserName = () => {
    const ua = navigator.userAgent;

    if (ua.includes('Edg')) return 'Microsoft Edge';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Safari')) return 'Safari';

    return 'Unknown';
  };

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSuccess(false);
    setSendError(false);

    const newError = {
      name: !name.trim(),
      email: !email.trim() || !validateEmail(email),
      subject: !subject.trim(),
      message: !message.trim(),
    };

    setError(newError);

    if (Object.values(newError).some(Boolean)) return;

    try {
      setLoading(true);

      const initials = name
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('');

      const timestamp = new Date().toLocaleString();

      const inquiryId =
        '#' + Date.now().toString(36).toUpperCase();

      const browser = getBrowserName();

      const platform = navigator.platform;

      const language = navigator.language;

      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      let ip = '';
      let location = '';

      try {
        const { data } = await axios.get(
          'https://ipapi.co/json/'
        );

        ip = data.ip ?? '';

        location = [
          data.city,
          data.region,
          data.country_name,
        ]
          .filter(Boolean)
          .join(', ');
      } catch (err) {
        console.error('Failed to fetch IP/location:', err);
      }

      await emailjs.send(
        'service_6uk51ch',
        'template_45wei9l',
        {
          name,
          initials,
          email,
          subject,
          message,

          timestamp,
          id: inquiryId,

          browser,
          platform,
          language,
          timezone,

          ip,
          location,
        },
        'GJD7pIhFsXAEGwQpV'
      );

      setSuccess(true);

      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('EmailJS failed:', err);
      setSendError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="contact" className="contact-container">
      <h2>Contact</h2>

      <Paper className="contact-card" elevation={0}>
        <h3>Send Message</h3>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Message sent successfully.
          </Alert>
        )}

        {sendError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to send message.
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={sendEmail}
          className="contact-form"
        >
          <div className="form-grid-2">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error.name}
              fullWidth
            />

            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error.email}
              fullWidth
            />
          </div>

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={error.subject}
            fullWidth
            sx={{ mt: 2 }}
          />

          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={error.message}
            multiline
            rows={8}
            fullWidth
            sx={{ mt: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={loading}
            className="send-button"
            sx={{
              mt: 3,
              borderRadius: '999px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default Contact;
