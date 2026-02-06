/**
 * Selector constants for VMS application
 * These selectors should match the IDs and roles in your application
 */

export const AUTH_SELECTORS = {
  // Login page
  LOGIN_EMAIL_INPUT: "#login_email_input",
  LOGIN_PASSWORD_INPUT: "#login_password_input",
  LOGIN_SUBMIT_BUTTON: "#login_submit_button",

  // Register page
  REGISTER_EMAIL_INPUT: "#register_email_input",
  REGISTER_PASSWORD_INPUT: "#register_password_input",
  REGISTER_CONFIRM_PASSWORD_INPUT: "#register_confirm_password_input",
  REGISTER_SUBMIT_BUTTON: "#register_submit_button",

  // Forgot password
  FORGOT_PASSWORD_EMAIL_INPUT: "#forgot_password_email_input",
  FORGOT_PASSWORD_SUBMIT_BUTTON: "#forgot_password_submit_button",
};

export const ADMIN_SELECTORS = {
  // Sidebar navigation
  SIDEBAR_HOUSES_LINK: "#sidebar_houses_link",
  SIDEBAR_RESIDENTS_LINK: "#sidebar_residents_link",
  SIDEBAR_GATE_LINK: "#sidebar_gate_link",
  SIDEBAR_DUES_LINK: "#sidebar_dues_link",
  SIDEBAR_ANALYTICS_LINK: "#sidebar_analytics_link",
  SIDEBAR_TRANSACTIONS_LINK: "#sidebar_transactions_link",

  // Common table elements
  TABLE_SEARCH_INPUT: "#table_search_input",
  TABLE_RELOAD_BUTTON: "#table_reload_button",
  TABLE_FILTER_BUTTON: "#table_filter_button",
};

export const RESIDENTS_SELECTORS = {
  CREATE_RESIDENT_BUTTON: "#create_resident_button",
  FIRSTNAME_INPUT: "#firstname_input",
  LASTNAME_INPUT: "#lastname_input",
  EMAIL_INPUT: "#email_input",
  PHONE_INPUT: "#phone_input",
  HOUSE_INPUT: "#house_input",
  SUBMIT_BUTTON: "#submit_button",
};

export const HOUSES_SELECTORS = {
  CREATE_HOUSE_BUTTON: "#create_house_button",
  HOUSE_NUMBER_INPUT: "#house_number_input",
  ADDRESS_INPUT: "#address_input",
  OWNER_NAME_INPUT: "#owner_name_input",
  STATUS_SELECT: "#status_select",
  SUBMIT_BUTTON: "#submit_button",
};

export const GATE_SELECTORS = {
  STATUS_FILTER: "#status_filter",
  START_DATE_INPUT: "#start_date_input",
  END_DATE_INPUT: "#end_date_input",
  APPLY_FILTER_BUTTON: "#apply_filter_button",
};
