
-- Attach phone +26775389897 to the existing admin account so phone OTP signs into it
UPDATE auth.users
SET phone = '26775389897',
    phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
    email = NULL,
    email_confirmed_at = NULL
WHERE id = '974fed61-568f-4de7-8f58-b379c7baed6b';

-- Clear any stale duplicate account that may have been created with the same phone
UPDATE auth.users
SET phone = NULL
WHERE phone = '26775389897'
  AND id <> '974fed61-568f-4de7-8f58-b379c7baed6b';

-- Make sure the profile phone matches
UPDATE public.profiles
SET phone = '75389897'
WHERE id = '974fed61-568f-4de7-8f58-b379c7baed6b';
