const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.should();

const getParser = require("../../src/cli/parser");
const exampleDir = require("../_getExampleDir");

const defaultParser = getParser(exampleDir());
const subdirParser = getParser(exampleDir("testdb"));

const bareArgv = "deploy --help";
const confArgv = "deploy --config test --help";
const missingConfArgv = "deploy --config notakey --help";
const overrideConfArgv =
  "deploy --config test --url http://localhost:5984 --help";

const parse = async (parser, input) => {
  return await new Promise((resolve) => {
    parser.parse(input, (err, argv, output) => resolve({ err, argv, output }));
  });
};

describe("CLI", function () {
  it("Should load config from rc file", async () => {
    const response = await parse(defaultParser, bareArgv);
    response.should.have.property("argv");
    response.argv.should.have.property("user");
    response.argv.user.should.equal("outer");
  });

  it("Should toss configs object from rc file", async () => {
    const response = await parse(defaultParser, bareArgv);
    response.argv.should.not.have.property("configs");
  });

  it("Should load config from config key", async () => {
    const response = await parse(defaultParser, confArgv);
    response.argv.should.have.property("user");
    response.argv.user.should.equal("inner");
  });

  it("Should throw an error if the config key doesn't exist", async () => {
    parse(defaultParser, missingConfArgv).should.eventually.throw();
  });

  it("Should override config files with command line option", async () => {
    const response = await parse(defaultParser, overrideConfArgv);
    response.argv.should.have.property("url");
    response.argv.url.should.equal("http://localhost:5984");
  });

  it("Should find the kivikrc context in a subdirectory", async () => {
    const response = await parse(subdirParser, confArgv);
    response.argv.should.have.property("url");
    response.argv.url.should.equal("http://localhost:22222");
  });
});
