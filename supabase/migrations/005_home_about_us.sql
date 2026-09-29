-- Home About Us sections (replaces Empire / Ascendra / Council content keys for new installs).
-- Existing empire/ascendra/council/mission/vision rows are left in place but unused by Home.

insert into public.pov_site_content (site_slug, section_key, title, subtitle, body, button_text, button_url, display_order, is_active)
values
  (
    'pinoy-online-venture',
    'about_us',
    'Pinoy Online Venture (POV) Community',
    'About Us',
    E'Pinoy Online Venture (POV) is a growing community designed to help Filipinos explore the opportunities of the online world, develop valuable digital skills, and build a mindset focused on growth and purposeful entrepreneurship.\n\nWe believe that everyone deserves an opportunity to learn, grow, and create possibilities online—whether you are an employee, OFW, student, parent, professional, or aspiring entrepreneur.\n\nThrough the POV Community, we provide access to learning sessions, mentorship, community support, digital tools, business education, and practical strategies that can help members take meaningful steps toward their personal and entrepreneurial goals.',
    null,
    null,
    10,
    true
  ),
  (
    'pinoy-online-venture',
    'about_purpose',
    'Our Purpose',
    null,
    'To build a community where Filipinos can learn, connect, take action, and grow together in the digital economy.',
    null,
    null,
    11,
    true
  ),
  (
    'pinoy-online-venture',
    'about_stand_for',
    'What We Stand For',
    'Learn. Connect. Take Action. Grow.',
    E'We encourage our members to continuously develop their skills, build meaningful connections, take consistent action, and support one another along the journey.\n\nPOV is more than just a community. It is a space where ideas become action, skills become opportunities, and people grow together.\n\nWelcome to POV Community — your online journey starts here.',
    null,
    null,
    12,
    true
  ),
  (
    'pinoy-online-venture',
    'know_more_promo',
    'Know More About POV',
    'Discover Pinoy Online Venture',
    'Discover our community, hear real stories from our members, and watch the Pinoy Online Venture presentation at a time that works for you.',
    'Know More About POV',
    '/know-more',
    13,
    true
  )
on conflict (site_slug, section_key) do nothing;
