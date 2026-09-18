# QA Audit Report

**Generated:** 2026-09-15T03:58:32.467Z
**Target:** http://localhost:5174
**Total Issues:** 72
**Critical:** 0 | **High:** 6 | **Medium:** 65 | **Low:** 1

## Accounts Tested

All accounts use password: `Test1234!`

### Admin Accounts
- admin@shiarishta.com
- moderator@shiarishta.com
### User Accounts
- aaliyah@example.com
- yusuf@example.com
- maryam@example.com

## Issue Summary

### High (6)

- **ONBOARD-002** [High] — admin@shiarishta.com @ /onboard
  - Steps: Click Continue on empty form
  - Expected: Validation errors shown
  - Actual: No validation errors
  - Visual: admin-super_onboard-validation.png

- **ONBOARD-002** [High] — moderator@shiarishta.com @ /onboard
  - Steps: Click Continue on empty form
  - Expected: Validation errors shown
  - Actual: No validation errors
  - Visual: admin-moderator_onboard-validation.png

- **ONBOARD-002** [High] — aaliyah@example.com @ /onboard
  - Steps: Click Continue on empty form
  - Expected: Validation errors shown
  - Actual: No validation errors
  - Visual: user-aaliyah_onboard-validation.png

- **ONBOARD-002** [High] — yusuf@example.com @ /onboard
  - Steps: Click Continue on empty form
  - Expected: Validation errors shown
  - Actual: No validation errors
  - Visual: user-yusuf_onboard-validation.png

- **ONBOARD-002** [High] — maryam@example.com @ /onboard
  - Steps: Click Continue on empty form
  - Expected: Validation errors shown
  - Actual: No validation errors
  - Visual: user-maryam_onboard-validation.png

- **REG-001** [High] — test1789444676255@example.com @ /auth/register
  - Steps: Register new account
  - Expected: Redirect to login/dashboard
  - Actual: Stayed at: http://localhost:5174/onboard
  - Visual: registration_03-after-register.png

### Medium (65)

- **PAGE-COMMUNITY** [Medium] — admin@shiarishta.com @ http://localhost:5174/community
  - Steps: Visit community
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-super_community.png

- **PAGE-CONTACT** [Medium] — admin@shiarishta.com @ http://localhost:5174/contact
  - Steps: Visit contact
  - Expected: Clean load, no errors
  - Actual: A11Y: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: admin-super_contact.png

- **PAGE-PRICING** [Medium] — admin@shiarishta.com @ http://localhost:5174/pricing
  - Steps: Visit pricing
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: relative w-12 h-6 rounded-full
  - Visual: admin-super_pricing.png

- **PAGE-SUPPORT** [Medium] — admin@shiarishta.com @ http://localhost:5174/support
  - Steps: Visit support
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-super_support.png

- **PAGE-AGENTS** [Medium] — admin@shiarishta.com @ http://localhost:5174/agents
  - Steps: Visit agents
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-super_agents.png

- **PAGE-SETTINGS** [Medium] — admin@shiarishta.com @ http://localhost:5174/settings
  - Steps: Visit settings
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=email
  - Visual: admin-super_settings.png

- **PAGE-ONBOARD** [Medium] — admin@shiarishta.com @ http://localhost:5174/onboard
  - Steps: Visit onboard
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=number; input no label: type=text
  - Visual: admin-super_onboard.png

- **PAGE-PROFILE-P1** [Medium] — admin@shiarishta.com @ http://localhost:5174/profiles/p1
  - Steps: Visit profile-p1
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: flex-1 aspect-square rounded-l; btn no label: flex-1 aspect-square rounded-l
  - Visual: admin-super_profile-p1.png

- **PAGE-PROFILE-NOTFOUND** [Medium] — admin@shiarishta.com @ http://localhost:5174/profiles/nonexistent
  - Steps: Visit profile-notfound
  - Expected: Clean load, no errors
  - Actual: PAGE ERRS: Empty state rendered (possible data load failure)
  - Visual: admin-super_profile-notfound.png

- **PAGE-COMMUNITY-HYD** [Medium] — admin@shiarishta.com @ http://localhost:5174/community/hyderabad
  - Steps: Visit community-hyd
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-super_community-hyd.png

- **NAV-settings** [Medium] — admin@shiarishta.com @ /settings
  - Steps: Navigate sidebar to Settings
  - Expected: Clean load
  - Actual: input no label: type=text; input no label: type=email
  - Visual: admin-super_nav-_settings.png

- **NAV-community** [Medium] — admin@shiarishta.com @ /community
  - Steps: Navigate sidebar to Community
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: admin-super_nav-_community.png

- **NAV-support** [Medium] — admin@shiarishta.com @ /support
  - Steps: Navigate sidebar to Support
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: admin-super_nav-_support.png

- **PAGE-COMMUNITY** [Medium] — moderator@shiarishta.com @ http://localhost:5174/community
  - Steps: Visit community
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-moderator_community.png

- **PAGE-CONTACT** [Medium] — moderator@shiarishta.com @ http://localhost:5174/contact
  - Steps: Visit contact
  - Expected: Clean load, no errors
  - Actual: A11Y: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: admin-moderator_contact.png

- **PAGE-PRICING** [Medium] — moderator@shiarishta.com @ http://localhost:5174/pricing
  - Steps: Visit pricing
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: relative w-12 h-6 rounded-full
  - Visual: admin-moderator_pricing.png

- **PAGE-SUPPORT** [Medium] — moderator@shiarishta.com @ http://localhost:5174/support
  - Steps: Visit support
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-moderator_support.png

- **PAGE-AGENTS** [Medium] — moderator@shiarishta.com @ http://localhost:5174/agents
  - Steps: Visit agents
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-moderator_agents.png

- **PAGE-SETTINGS** [Medium] — moderator@shiarishta.com @ http://localhost:5174/settings
  - Steps: Visit settings
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=email
  - Visual: admin-moderator_settings.png

- **PAGE-ONBOARD** [Medium] — moderator@shiarishta.com @ http://localhost:5174/onboard
  - Steps: Visit onboard
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=number; input no label: type=text
  - Visual: admin-moderator_onboard.png

- **PAGE-PROFILE-P1** [Medium] — moderator@shiarishta.com @ http://localhost:5174/profiles/p1
  - Steps: Visit profile-p1
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: flex-1 aspect-square rounded-l; btn no label: flex-1 aspect-square rounded-l
  - Visual: admin-moderator_profile-p1.png

- **PAGE-PROFILE-NOTFOUND** [Medium] — moderator@shiarishta.com @ http://localhost:5174/profiles/nonexistent
  - Steps: Visit profile-notfound
  - Expected: Clean load, no errors
  - Actual: PAGE ERRS: Empty state rendered (possible data load failure)
  - Visual: admin-moderator_profile-notfound.png

- **PAGE-COMMUNITY-HYD** [Medium] — moderator@shiarishta.com @ http://localhost:5174/community/hyderabad
  - Steps: Visit community-hyd
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: admin-moderator_community-hyd.png

- **NAV-settings** [Medium] — moderator@shiarishta.com @ /settings
  - Steps: Navigate sidebar to Settings
  - Expected: Clean load
  - Actual: input no label: type=text; input no label: type=email
  - Visual: admin-moderator_nav-_settings.png

- **NAV-community** [Medium] — moderator@shiarishta.com @ /community
  - Steps: Navigate sidebar to Community
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: admin-moderator_nav-_community.png

- **NAV-support** [Medium] — moderator@shiarishta.com @ /support
  - Steps: Navigate sidebar to Support
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: admin-moderator_nav-_support.png

- **PAGE-COMMUNITY** [Medium] — aaliyah@example.com @ http://localhost:5174/community
  - Steps: Visit community
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-aaliyah_community.png

- **PAGE-CONTACT** [Medium] — aaliyah@example.com @ http://localhost:5174/contact
  - Steps: Visit contact
  - Expected: Clean load, no errors
  - Actual: A11Y: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: user-aaliyah_contact.png

- **PAGE-PRICING** [Medium] — aaliyah@example.com @ http://localhost:5174/pricing
  - Steps: Visit pricing
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: relative w-12 h-6 rounded-full
  - Visual: user-aaliyah_pricing.png

- **PAGE-SUPPORT** [Medium] — aaliyah@example.com @ http://localhost:5174/support
  - Steps: Visit support
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-aaliyah_support.png

- **PAGE-AGENTS** [Medium] — aaliyah@example.com @ http://localhost:5174/agents
  - Steps: Visit agents
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-aaliyah_agents.png

- **PAGE-SETTINGS** [Medium] — aaliyah@example.com @ http://localhost:5174/settings
  - Steps: Visit settings
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=email
  - Visual: user-aaliyah_settings.png

- **PAGE-ONBOARD** [Medium] — aaliyah@example.com @ http://localhost:5174/onboard
  - Steps: Visit onboard
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=number; input no label: type=text
  - Visual: user-aaliyah_onboard.png

- **PAGE-PROFILE-P1** [Medium] — aaliyah@example.com @ http://localhost:5174/profiles/p1
  - Steps: Visit profile-p1
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: flex-1 aspect-square rounded-l; btn no label: flex-1 aspect-square rounded-l
  - Visual: user-aaliyah_profile-p1.png

- **PAGE-PROFILE-NOTFOUND** [Medium] — aaliyah@example.com @ http://localhost:5174/profiles/nonexistent
  - Steps: Visit profile-notfound
  - Expected: Clean load, no errors
  - Actual: PAGE ERRS: Empty state rendered (possible data load failure)
  - Visual: user-aaliyah_profile-notfound.png

- **PAGE-COMMUNITY-HYD** [Medium] — aaliyah@example.com @ http://localhost:5174/community/hyderabad
  - Steps: Visit community-hyd
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-aaliyah_community-hyd.png

- **NAV-community** [Medium] — aaliyah@example.com @ /community
  - Steps: Navigate sidebar to Community
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: user-aaliyah_nav-_community.png

- **NAV-contact** [Medium] — aaliyah@example.com @ /contact
  - Steps: Navigate sidebar to Contact
  - Expected: Clean load
  - Actual: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: user-aaliyah_nav-_contact.png

- **PAGE-COMMUNITY** [Medium] — yusuf@example.com @ http://localhost:5174/community
  - Steps: Visit community
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-yusuf_community.png

- **PAGE-CONTACT** [Medium] — yusuf@example.com @ http://localhost:5174/contact
  - Steps: Visit contact
  - Expected: Clean load, no errors
  - Actual: A11Y: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: user-yusuf_contact.png

- **PAGE-PRICING** [Medium] — yusuf@example.com @ http://localhost:5174/pricing
  - Steps: Visit pricing
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: relative w-12 h-6 rounded-full
  - Visual: user-yusuf_pricing.png

- **PAGE-SUPPORT** [Medium] — yusuf@example.com @ http://localhost:5174/support
  - Steps: Visit support
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-yusuf_support.png

- **PAGE-AGENTS** [Medium] — yusuf@example.com @ http://localhost:5174/agents
  - Steps: Visit agents
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-yusuf_agents.png

- **PAGE-SETTINGS** [Medium] — yusuf@example.com @ http://localhost:5174/settings
  - Steps: Visit settings
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=email
  - Visual: user-yusuf_settings.png

- **PAGE-ONBOARD** [Medium] — yusuf@example.com @ http://localhost:5174/onboard
  - Steps: Visit onboard
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=number; input no label: type=text
  - Visual: user-yusuf_onboard.png

- **PAGE-PROFILE-P1** [Medium] — yusuf@example.com @ http://localhost:5174/profiles/p1
  - Steps: Visit profile-p1
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: flex-1 aspect-square rounded-l; btn no label: flex-1 aspect-square rounded-l
  - Visual: user-yusuf_profile-p1.png

- **PAGE-PROFILE-NOTFOUND** [Medium] — yusuf@example.com @ http://localhost:5174/profiles/nonexistent
  - Steps: Visit profile-notfound
  - Expected: Clean load, no errors
  - Actual: PAGE ERRS: Empty state rendered (possible data load failure)
  - Visual: user-yusuf_profile-notfound.png

- **PAGE-COMMUNITY-HYD** [Medium] — yusuf@example.com @ http://localhost:5174/community/hyderabad
  - Steps: Visit community-hyd
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-yusuf_community-hyd.png

- **NAV-community** [Medium] — yusuf@example.com @ /community
  - Steps: Navigate sidebar to Community
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: user-yusuf_nav-_community.png

- **NAV-contact** [Medium] — yusuf@example.com @ /contact
  - Steps: Navigate sidebar to Contact
  - Expected: Clean load
  - Actual: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: user-yusuf_nav-_contact.png

- **PAGE-COMMUNITY** [Medium] — maryam@example.com @ http://localhost:5174/community
  - Steps: Visit community
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-maryam_community.png

- **PAGE-CONTACT** [Medium] — maryam@example.com @ http://localhost:5174/contact
  - Steps: Visit contact
  - Expected: Clean load, no errors
  - Actual: A11Y: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: user-maryam_contact.png

- **PAGE-PRICING** [Medium] — maryam@example.com @ http://localhost:5174/pricing
  - Steps: Visit pricing
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: relative w-12 h-6 rounded-full
  - Visual: user-maryam_pricing.png

- **PAGE-SUPPORT** [Medium] — maryam@example.com @ http://localhost:5174/support
  - Steps: Visit support
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-maryam_support.png

- **PAGE-AGENTS** [Medium] — maryam@example.com @ http://localhost:5174/agents
  - Steps: Visit agents
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-maryam_agents.png

- **PAGE-SETTINGS** [Medium] — maryam@example.com @ http://localhost:5174/settings
  - Steps: Visit settings
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=email
  - Visual: user-maryam_settings.png

- **PAGE-ONBOARD** [Medium] — maryam@example.com @ http://localhost:5174/onboard
  - Steps: Visit onboard
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text; input no label: type=number; input no label: type=text
  - Visual: user-maryam_onboard.png

- **PAGE-PROFILE-P1** [Medium] — maryam@example.com @ http://localhost:5174/profiles/p1
  - Steps: Visit profile-p1
  - Expected: Clean load, no errors
  - Actual: A11Y: btn no label: flex-1 aspect-square rounded-l; btn no label: flex-1 aspect-square rounded-l
  - Visual: user-maryam_profile-p1.png

- **PAGE-PROFILE-NOTFOUND** [Medium] — maryam@example.com @ http://localhost:5174/profiles/nonexistent
  - Steps: Visit profile-notfound
  - Expected: Clean load, no errors
  - Actual: PAGE ERRS: Empty state rendered (possible data load failure)
  - Visual: user-maryam_profile-notfound.png

- **PAGE-COMMUNITY-HYD** [Medium] — maryam@example.com @ http://localhost:5174/community/hyderabad
  - Steps: Visit community-hyd
  - Expected: Clean load, no errors
  - Actual: A11Y: input no label: type=text
  - Visual: user-maryam_community-hyd.png

- **NAV-community** [Medium] — maryam@example.com @ /community
  - Steps: Navigate sidebar to Community
  - Expected: Clean load
  - Actual: input no label: type=text
  - Visual: user-maryam_nav-_community.png

- **NAV-contact** [Medium] — maryam@example.com @ /contact
  - Steps: Navigate sidebar to Contact
  - Expected: Clean load
  - Actual: a href="#": Ann Arbor, MI, United States; a href="#": Urgent matters — 1–2 hours; a href="#": General questions — 4–8 hours; a href="#": Detailed feedback — 24 hours
  - Visual: user-maryam_nav-_contact.png

- **MOBILE-OVERFLOW** [Medium] — mobile @ http://localhost:5174/auth/login
  - Steps: Mobile view: login
  - Expected: No horizontal overflow
  - Actual: Overflow: DIV.absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full o w=480 vw=375; DIV.absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-fu w=480 vw=375
  - Visual: mobile_login.png

- **MOBILE-OVERFLOW** [Medium] — mobile @ http://localhost:5174/profiles
  - Steps: Mobile view: profiles
  - Expected: No horizontal overflow
  - Actual: Overflow: IMG.pcard-img privacy-blur w=382 vw=375; IMG.pcard-img privacy-blur w=382 vw=375; IMG.pcard-img privacy-blur w=382 vw=375; IMG.pcard-img privacy-blur w=382 vw=375; IMG.pcard-img privacy-blur w=382 vw=375; IMG.pcard-img privacy-blur w=382 vw=375; IMG.pcard-img privacy-blur w=382 vw=375
  - Visual: mobile_profiles.png

- **MOBILE-SCROLL** [Medium] — mobile @ http://localhost:5174/admin
  - Steps: Mobile view: admin
  - Expected: No horizontal scroll
  - Actual: Page wider than viewport
  - Visual: mobile_admin.png

### Low (1)

- **EDGE-001** [Low] — guest @ /profiles/9999
  - Steps: Visit invalid profile ID
  - Expected: 404 or not found message
  - Actual: Regular content shown
  - Visual: edge_invalid-profile.png

