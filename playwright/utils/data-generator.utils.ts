import { faker } from "@faker-js/faker";

/**
 * Generate fake data for testing
 */
export class TestDataGenerator {
  /**
   * Generate a unique email
   */
  static generateEmail(): string {
    return faker.internet.email();
  }

  /**
   * Generate a phone number
   */
  static generatePhone(): string {
    return faker.phone.number("080########");
  }

  /**
   * Generate a first name
   */
  static generateFirstName(): string {
    return faker.person.firstName();
  }

  /**
   * Generate a last name
   */
  static generateLastName(): string {
    return faker.person.lastName();
  }

  /**
   * Generate a full name
   */
  static generateFullName(): string {
    return faker.person.fullName();
  }

  /**
   * Generate an address
   */
  static generateAddress(): string {
    return faker.location.streetAddress();
  }

  /**
   * Generate house number
   */
  static generateHouseNumber(): string {
    return `H${faker.number.int({ min: 1, max: 999 })}`;
  }

  /**
   * Generate a unique identifier with prefix
   */
  static generateUniqueId(prefix = "test"): string {
    return `${prefix}_${Date.now()}_${faker.number.int({ min: 1000, max: 9999 })}`;
  }

  /**
   * Generate resident data
   */
  static generateResidentData() {
    return {
      firstName: this.generateFirstName(),
      lastName: this.generateLastName(),
      email: this.generateEmail(),
      phone: this.generatePhone(),
      houseNumber: this.generateHouseNumber(),
    };
  }

  /**
   * Generate house data
   */
  static generateHouseData() {
    return {
      houseNumber: this.generateHouseNumber(),
      address: this.generateAddress(),
      ownerName: this.generateFullName(),
    };
  }

  /**
   * Generate password
   */
  static generatePassword(): string {
    return faker.internet.password({ length: 12, memorable: true }) + "1!";
  }
}
