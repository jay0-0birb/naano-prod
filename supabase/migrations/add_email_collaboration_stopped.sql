-- Add preference for "collaboration stopped" email notifications
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS email_collaboration_stopped BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.notification_preferences.email_collaboration_stopped IS 'Send email when a collaboration is stopped/cancelled';
