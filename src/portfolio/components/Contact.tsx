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
import Tooltip from '@mui/material/Tooltip';

import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
  const [copySuccess, setCopySuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Edg')) return 'Microsoft Edge';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Safari')) return 'Safari';
    return 'Unknown';
  };

  const isFormValid = useMemo(
    () => name.trim() && validateEmail(email) && subject.trim() && message.trim(),
    [name, email, subject, message],
  );

  useEffect(() => {
    if (!success && !sendError) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      setSendError(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [success, sendError]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

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
      const inquiryId = '#' + Date.now().toString(36).toUpperCase();
      setReferenceId(inquiryId);

      const browser = getBrowserName();
      const platform = navigator.platform;
      const language = navigator.language;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      let ip = '';
      let location = '';

      try {
        const { data } = await axios.get('https://ipapi.co/json/');
        ip = data.ip ?? '';
        location = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
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
        'GJD7pIhFsXAEGwQpV',
      );

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setCharCount(0);
      setError({ name: false, email: false, subject: false, message: false });
    } catch (err) {
      console.error('EmailJS failed:', err);
      setSendError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (value: string) => {
    setSubject(value);
    if (error.subject) {
      setError((prev) => ({ ...prev, subject: false }));
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('tdy.alhssan@gmail.com');
    setCopySuccess(true);
  };

  return (
    <div id="contact" className="contact-container">
      <div className="contact-grid">
        {/* LEFT COLUMN - Info */}
        <div className="contact-info">
          <div className="contact-header">
            <span className="header-tag">CONTACT</span>
            <h2>Let's Work Together</h2>
            <div className="contact-divider" />
            <p className="contact-subtitle">
              Have a project in mind, a question, or just want to say hello?
              <br />
              <br />
              I'd love to hear from you.
            </p>
          </div>

          <div className="direct-email-card">
            <div className="direct-email-meta">
              <span>DIRECT EMAIL</span>
              <span>CAVITE, PH (GMT+8)</span>
            </div>
            <div className="direct-email-row">
              <span className="direct-email-address">tdy.alhssan@gmail.com</span>
              <Tooltip title={copySuccess ? 'Copied!' : 'Copy email'}>
                <Button
                  className="direct-email-copy"
                  onClick={handleCopyEmail}
                  size="small"
                  startIcon={copySuccess ? <CheckCircleIcon /> : <ContentCopyIcon />}
                >
                  {copySuccess ? 'COPIED' : 'COPY'}
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="contact-details">
            <div className="contact-detail-item">
              <div className="detail-icon">
                <AccessTimeIcon />
              </div>
              <div className="detail-content">
                <span className="detail-label">Availability</span>
                <span className="detail-value">Open to opportunities</span>
                <span className="detail-badge">Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Form */}
        <Paper className="contact-card" elevation={0}>
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
                <Alert icon={<CheckCircleIcon />} severity="success" className="alert-success">
                  <div className="alert-content">
                    <strong>Message sent successfully!</strong>
                    <br />
                    <span className="alert-reference">
                      Reference ID: <strong>{referenceId}</strong>
                    </span>
                    <br />
                    <span className="alert-thanks">
                      Thank you for reaching out. I'll respond within 24-48 hours.
                    </span>
                  </div>
                </Alert>
              )}
            </Box>
          </Fade>

          <Fade in={sendError} timeout={400}>
            <Box>
              {sendError && (
                <Alert icon={<ErrorIcon />} severity="error" className="alert-error">
                  <div className="alert-content">
                    <strong>Failed to send message.</strong>
                    <br />
                    <span>Please try again or contact me directly via email.</span>
                  </div>
                </Alert>
              )}
            </Box>
          </Fade>

          <Box className="chips-container">
            <Typography variant="caption" className="chips-label">
              Quick subject suggestions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="chips-stack">
              {[
                'Project Inquiry',
                'Collaboration',
                'General Question',
                'Bug Report',
                'Feedback',
              ].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  onClick={() => handleChipClick(label)}
                  className={`chip-item ${subject === label ? 'chip-selected' : ''}`}
                />
              ))}
            </Stack>
          </Box>

          <Box component="form" onSubmit={sendEmail} className="contact-form">
            <div className="form-grid-2">
              <TextField
                label="Your Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error.name) setError((prev) => ({ ...prev, name: false }));
                }}
                error={error.name}
                helperText={error.name ? 'Name is required' : ''}
                fullWidth
                className="form-field"
                variant="outlined"
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                label="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error.email) setError((prev) => ({ ...prev, email: false }));
                }}
                onBlur={() => {
                  if (email.trim()) {
                    setError((prev) => ({ ...prev, email: !validateEmail(email) }));
                  }
                }}
                error={error.email}
                helperText={error.email ? 'Please enter a valid email' : ''}
                fullWidth
                className="form-field"
                variant="outlined"
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </div>

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (error.subject) setError((prev) => ({ ...prev, subject: false }));
              }}
              error={error.subject}
              helperText={error.subject ? 'Subject is required' : ''}
              fullWidth
              className="form-field"
              variant="outlined"
              sx={{ mt: 2 }}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              label="Message"
              value={message}
              onChange={(e) => {
                const value = e.target.value;
                setMessage(value);
                setCharCount(value.length);
                if (error.message) setError((prev) => ({ ...prev, message: false }));
              }}
              error={error.message}
              helperText={
                error.message
                  ? 'Message is required'
                  : `${charCount}/1000 characters${charCount > 800 ? ' (almost there!)' : ''}`
              }
              multiline
              rows={5}
              fullWidth
              className="form-field"
              variant="outlined"
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 1000 }}
              required
              InputLabelProps={{
                shrink: true,
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
                    <CircularProgress size={20} color="inherit" className="button-spinner" />
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

            <div className="form-footer">
              <span className="form-footer-text">
                <OpenInNewIcon className="footer-icon" />
                Your message will be sent securely
              </span>
            </div>
          </Box>
        </Paper>
      </div>
    </div>
  );
}

export default Contact;
