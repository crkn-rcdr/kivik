const chai = require("chai");
chai.should();

const Logger = require("../src/Logger");

describe("Logger", () => {
  const logger = Logger.get();

  it("shouldn't blow up", () => {
    logger.should.be.an("object");
  });
});
