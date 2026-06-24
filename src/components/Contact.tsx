import React, { useEffect, useMemo, useState } from 'react';
import '../assets/styles/Contact.scss';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

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

  const [referenceId, setReferenceId] = useState('');

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

  const isFormValid = useMemo(
    () =>
      name.trim() &&
      validateEmail(email) &&
      subject.trim() &&
      message.trim(),
    [name, email, subject, message]
  );

  useEffect(() => {
    if (!success && !sendError) return;

    const timer = setTimeout(() => {
      setSuccess(false);
      setSendError(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [success, sendError]);

  const sendEmail = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
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

    if (Object.values(newError).some(Boolean)) {
      return;
    }

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

      setReferenceId(inquiryId);

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
        console.error(
          'Failed to fetch IP/location:',
          err
        );
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

      setError({
        name: false,
        email: false,
        subject: false,
        message: false,
      });
    } catch (err) {
      console.error('EmailJS failed:', err);
      setSendError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="contact"
      className="contact-container"
    >
      <h2>Let's Work Together</h2>

      <p
        style={{
          maxWidth: 600,
          opacity: 0.8,
        }}
      >
        Have a project in mind, a question,
        or just want to say hello? I'd love
        to hear from you.
      </p>

      <Paper
        className="contact-card"
        elevation={0}
      >
        <h3>Send Message</h3>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
          >
            Message sent successfully.
            <br />
            Reference ID:{' '}
            <strong>{referenceId}</strong>
          </Alert>
        )}

        {sendError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            Failed to send message.
            Please try again.
          </Alert>
        )}

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 2 }}
        >
          <Chip
            label="Project Inquiry"
            onClick={() =>
              setSubject('Project Inquiry')
            }
          />

          <Chip
            label="Collaboration"
            onClick={() =>
              setSubject('Collaboration')
            }
          />

          <Chip
            label="General Question"
            onClick={() =>
              setSubject('General Question')
            }
          />

          <Chip
            label="Bug Report"
            onClick={() =>
              setSubject('Bug Report')
            }
          />
        </Stack>

        <Box
          component="form"
          onSubmit={sendEmail}
          className="contact-form"
        >
          <div className="form-grid-2">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);

                if (error.name) {
                  setError((prev) => ({
                    ...prev,
                    name: false,
                  }));
                }
              }}
              error={error.name}
              helperText={
                error.name
                  ? 'Name is required'
                  : ''
              }
              fullWidth
            />

            <TextField
              label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (error.email) {
                  setError((prev) => ({
                    ...prev,
                    email: false,
                  }));
                }
              }}
              onBlur={() => {
                setError((prev) => ({
                  ...prev,
                  email:
                    !validateEmail(email),
                }));
              }}
              error={error.email}
              helperText={
                error.email
                  ? 'Enter a valid email address'
                  : ''
              }
              fullWidth
            />
          </div>

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);

              if (error.subject) {
                setError((prev) => ({
                  ...prev,
                  subject: false,
                }));
              }
            }}
            error={error.subject}
            helperText={
              error.subject
                ? 'Subject is required'
                : ''
            }
            fullWidth
            sx={{ mt: 2 }}
          />

          <TextField
            label="Message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);

              if (error.message) {
                setError((prev) => ({
                  ...prev,
                  message: false,
                }));
              }
            }}
            error={error.message}
            helperText={
              error.message
                ? 'Message is required'
                : `${message.length}/1000`
            }
            multiline
            rows={8}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 1000,
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={
              !isFormValid || loading
            }
            className="send-button"
            endIcon={
              loading ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              mt: 3,
              borderRadius: '999px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {loading
              ? 'Sending...'
              : 'Send Message'}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default Contact;