-- Mobile on QR passes + popup delay seconds (controlled on Admin → Events)

alter table public.pov_event_registrants
  add column if not exists mobile text;

alter table public.pov_events
  add column if not exists registration_popup_delay_seconds integer not null default 3
    check (registration_popup_delay_seconds >= 0 and registration_popup_delay_seconds <= 300);
