-- Community page CMS sections (hero, mission, vision, represents, Ascendra, council).

insert into public.pov_site_content (site_slug, section_key, title, subtitle, body, image_url, button_text, button_url, display_order, is_active)
values
  (
    'pinoy-online-venture',
    'community_intro',
    'Community',
    'POV is a place where you don’t have to build alone.',
    null,
    null,
    null,
    null,
    20,
    true
  ),
  (
    'pinoy-online-venture',
    'community_mission',
    'Mission',
    null,
    'Add your community mission here.',
    null,
    null,
    null,
    21,
    true
  ),
  (
    'pinoy-online-venture',
    'community_vision',
    'Vision',
    null,
    'Add your community vision here.',
    null,
    null,
    null,
    22,
    true
  ),
  (
    'pinoy-online-venture',
    'community_represents',
    'What the community represents.',
    null,
    null,
    null,
    null,
    null,
    23,
    true
  ),
  (
    'pinoy-online-venture',
    'community_ascendra',
    'POV powered by Ascendra International',
    null,
    null,
    null,
    null,
    null,
    24,
    true
  ),
  (
    'pinoy-online-venture',
    'community_council',
    'POV Council',
    'The People Behind the Vision|Management',
    null,
    null,
    null,
    null,
    25,
    true
  )
on conflict (site_slug, section_key) do nothing;
