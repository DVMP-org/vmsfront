const legacyRedirects = [
  {
    source: "/admin/dues/:path*",
    destination: "/admin/charges?legacy=dues",
    permanent: false,
  },
  {
    source: "/admin/residencies/:path*",
    destination: "/admin/properties?legacy=residencies",
    permanent: false,
  },
  {
    source: "/admin/residents/:path*",
    destination: "/admin/people?legacy=residents",
    permanent: false,
  },
  {
    source: "/admin/residency-groups/:path*",
    destination: "/admin/people?legacy=residency-groups",
    permanent: false,
  },
  {
    source: "/admin/gate/:path*",
    destination: "/admin/checkpoints?legacy=gate",
    permanent: false,
  },
  {
    source: "/residency/:path*",
    destination: "/select?legacy=residency",
    permanent: false,
  },
  {
    source: "/visit/:path*",
    destination: "/auth/login?next=%2Fselect&legacy=visit",
    permanent: false,
  },
];

module.exports = { legacyRedirects };
