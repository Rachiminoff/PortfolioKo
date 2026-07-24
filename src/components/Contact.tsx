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
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';

import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';

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
    }, 6000);

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
      <div className="contact-header">
        <span className="header-tag">CONTACT</span>
        <h2>Let's Work Together</h2>
        
        <div className="contact-divider" />
        
        <p className="contact-subtitle">
          Have a project in mind, a question, or just want to say hello? 
          <br />
          I'd love to hear from you.
        </p>
      </div>

      <Paper
        className="contact-card"
        elevation={0}
      >
        <div className="contact-card-header">
          <Typography variant="h4" className="card-title">
            Send a Message
          </Typography>
          <Typography variant="body2" className="card-subtitle">
            I'll get back to you as soon as possible
          </Typography>
        </div>

        <Divider className="card-divider" />

        <Fade in={success} timeout={400}>
          <Box>
            {success && (
              <Alert
                icon={<CheckCircleIcon />}
                severity="success"
                className="alert-success"
                sx={{ mb: 3 }}
              >
                <div className="alert-content">
                  <strong>Message sent successfully!</strong>
                  <br />
                  <span className="alert-reference">
                    Reference ID: <strong>{referenceId}</strong>
                  </span>
                </div>
              </Alert>
            )}
          </Box>
        </Fade>

        <Fade in={sendError} timeout={400}>
          <Box>
            {sendError && (
              <Alert
                icon={<ErrorIcon />}
                severity="error"
                className="alert-error"
                sx={{ mb: 3 }}
              >
                <div className="alert-content">
                  <strong>Failed to send message.</strong>
                  <br />
                  <span>Please try again or contact me directly.</span>
                </div>
              </Alert>
            )}
          </Box>
        </Fade>

        <Box className="chips-container">
          <Typography variant="caption" className="chips-label">
            Quick subject suggestions
          </Typography>
          
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            className="chips-stack"
          >
            <Chip
              label="Project Inquiry"
              onClick={() => setSubject('Project Inquiry')}
              className={`chip-item ${subject === 'Project Inquiry' ? 'chip-selected' : ''}`}
            />

            <Chip
              label="Collaboration"
              onClick={() => setSubject('Collaboration')}
              className={`chip-item ${subject === 'Collaboration' ? 'chip-selected' : ''}`}
            />

            <Chip
              label="General Question"
              onClick={() => setSubject('General Question')}
              className={`chip-item ${subject === 'General Question' ? 'chip-selected' : ''}`}
            />

            <Chip
              label="Bug Report"
              onClick={() => setSubject('Bug Report')}
              className={`chip-item ${subject === 'Bug Report' ? 'chip-selected' : ''}`}
            />
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={sendEmail}
          className="contact-form"
        >
          <div className="form-grid-2">
            <TextField
              label="Your Name"
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
              helperText={error.name ? 'Name is required' : ''}
              fullWidth
              className="form-field"
              variant="outlined"
            />

            <TextField
              label="Email Address"
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
                if (email.trim()) {
                  setError((prev) => ({
                    ...prev,
                    email: !validateEmail(email),
                  }));
                }
              }}
              error={error.email}
              helperText={error.email ? 'Please enter a valid email' : ''}
              fullWidth
              className="form-field"
              variant="outlined"
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
            helperText={error.subject ? 'Subject is required' : ''}
            fullWidth
            className="form-field"
            variant="outlined"
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
                : `${message.length}/1000 characters`
            }
            multiline
            rows={8}
            fullWidth
            className="form-field"
            variant="outlined"
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 1000,
            }}
          />

          <div className="form-actions">
            <Button
              type="submit"
              variant="contained"
              disabled={!isFormValid || loading}
              className="send-button"
              endIcon={
                loading ? (
                  <CircularProgress
                    size={20}
                    color="inherit"
                    className="button-spinner"
                  />
                ) : (
                  <SendIcon className="send-icon" />
                )
              }
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>

            <div className="trust-indicator">
              <ScheduleIcon className="trust-icon" />
              <span>Typically replies within 24–48 hours</span>
            </div>
          </div>
        </Box>
      </Paper>
    </div>
  );
}

export default Contact;