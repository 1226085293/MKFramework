/*eslint-disable*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = {};

export const common = $root.common = (() => {

    /**
     * Namespace common.
     * @exports common
     * @namespace
     */
    const common = {};

    /**
     * MessageID enum.
     * @name common.MessageID
     * @enum {number}
     * @property {number} Test=0 测试消息
     * @property {number} Test2=1 Test2 value
     */
    common.MessageID = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "Test"] = 0;
        values[valuesById[1] = "Test2"] = 1;
        return values;
    })();

    common.Package = (function() {

        /**
         * Properties of a Package.
         * @memberof common
         * @interface IPackage
         * @property {number|null} [id] 消息号
         * @property {number|null} [sequence] 消息序列号
         * @property {Uint8Array|null} [data] 消息体
         */

        /**
         * Constructs a new Package.
         * @memberof common
         * @classdesc Represents a Package.
         * @implements IPackage
         * @constructor
         * @param {common.IPackage=} [properties] Properties to set
         */
        function Package(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * 消息号
         * @member {number} id
         * @memberof common.Package
         * @instance
         */
        Package.prototype.id = 0;

        /**
         * 消息序列号
         * @member {number} sequence
         * @memberof common.Package
         * @instance
         */
        Package.prototype.sequence = 0;

        /**
         * 消息体
         * @member {Uint8Array} data
         * @memberof common.Package
         * @instance
         */
        Package.prototype.data = $util.newBuffer([]);

        /**
         * Creates a new Package instance using the specified properties.
         * @function create
         * @memberof common.Package
         * @static
         * @param {common.IPackage=} [properties] Properties to set
         * @returns {common.Package} Package instance
         */
        Package.create = function create(properties) {
            return new Package(properties);
        };

        /**
         * Encodes the specified Package message. Does not implicitly {@link common.Package.verify|verify} messages.
         * @function encode
         * @memberof common.Package
         * @static
         * @param {common.IPackage} message Package message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Package.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.sequence != null && Object.hasOwnProperty.call(message, "sequence"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.sequence);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.data);
            return writer;
        };

        /**
         * Encodes the specified Package message, length delimited. Does not implicitly {@link common.Package.verify|verify} messages.
         * @function encodeDelimited
         * @memberof common.Package
         * @static
         * @param {common.IPackage} message Package message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Package.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Package message from the specified reader or buffer.
         * @function decode
         * @memberof common.Package
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {common.Package} Package
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Package.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.common.Package();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.int32();
                        break;
                    }
                case 2: {
                        message.sequence = reader.int32();
                        break;
                    }
                case 3: {
                        message.data = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Package message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof common.Package
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {common.Package} Package
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Package.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Package message.
         * @function verify
         * @memberof common.Package
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Package.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.sequence != null && message.hasOwnProperty("sequence"))
                if (!$util.isInteger(message.sequence))
                    return "sequence: integer expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            return null;
        };

        /**
         * Creates a Package message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof common.Package
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {common.Package} Package
         */
        Package.fromObject = function fromObject(object) {
            if (object instanceof $root.common.Package)
                return object;
            let message = new $root.common.Package();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.sequence != null)
                message.sequence = object.sequence | 0;
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length >= 0)
                    message.data = object.data;
            return message;
        };

        /**
         * Creates a plain object from a Package message. Also converts values to other types if specified.
         * @function toObject
         * @memberof common.Package
         * @static
         * @param {common.Package} message Package
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Package.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.id = 0;
                object.sequence = 0;
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.sequence != null && message.hasOwnProperty("sequence"))
                object.sequence = message.sequence;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            return object;
        };

        /**
         * Converts this Package to JSON.
         * @function toJSON
         * @memberof common.Package
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Package.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Package
         * @function getTypeUrl
         * @memberof common.Package
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Package.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/common.Package";
        };

        return Package;
    })();

    common.TestC = (function() {

        /**
         * Properties of a TestC.
         * @memberof common
         * @interface ITestC
         * @property {number|null} [data] TestC data
         */

        /**
         * Constructs a new TestC.
         * @memberof common
         * @classdesc Represents a TestC.
         * @implements ITestC
         * @constructor
         * @param {common.ITestC=} [properties] Properties to set
         */
        function TestC(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TestC data.
         * @member {number} data
         * @memberof common.TestC
         * @instance
         */
        TestC.prototype.data = 0;

        /**
         * Creates a new TestC instance using the specified properties.
         * @function create
         * @memberof common.TestC
         * @static
         * @param {common.ITestC=} [properties] Properties to set
         * @returns {common.TestC} TestC instance
         */
        TestC.create = function create(properties) {
            return new TestC(properties);
        };

        /**
         * Encodes the specified TestC message. Does not implicitly {@link common.TestC.verify|verify} messages.
         * @function encode
         * @memberof common.TestC
         * @static
         * @param {common.ITestC} message TestC message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TestC.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.data);
            return writer;
        };

        /**
         * Encodes the specified TestC message, length delimited. Does not implicitly {@link common.TestC.verify|verify} messages.
         * @function encodeDelimited
         * @memberof common.TestC
         * @static
         * @param {common.ITestC} message TestC message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TestC.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a TestC message from the specified reader or buffer.
         * @function decode
         * @memberof common.TestC
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {common.TestC} TestC
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TestC.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.common.TestC();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.data = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a TestC message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof common.TestC
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {common.TestC} TestC
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TestC.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TestC message.
         * @function verify
         * @memberof common.TestC
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TestC.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isInteger(message.data))
                    return "data: integer expected";
            return null;
        };

        /**
         * Creates a TestC message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof common.TestC
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {common.TestC} TestC
         */
        TestC.fromObject = function fromObject(object) {
            if (object instanceof $root.common.TestC)
                return object;
            let message = new $root.common.TestC();
            if (object.data != null)
                message.data = object.data | 0;
            return message;
        };

        /**
         * Creates a plain object from a TestC message. Also converts values to other types if specified.
         * @function toObject
         * @memberof common.TestC
         * @static
         * @param {common.TestC} message TestC
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TestC.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.data = 0;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this TestC to JSON.
         * @function toJSON
         * @memberof common.TestC
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TestC.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for TestC
         * @function getTypeUrl
         * @memberof common.TestC
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TestC.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/common.TestC";
        };

        return TestC;
    })();

    common.TestS = (function() {

        /**
         * Properties of a TestS.
         * @memberof common
         * @interface ITestS
         * @property {number|null} [data] TestS data
         */

        /**
         * Constructs a new TestS.
         * @memberof common
         * @classdesc Represents a TestS.
         * @implements ITestS
         * @constructor
         * @param {common.ITestS=} [properties] Properties to set
         */
        function TestS(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TestS data.
         * @member {number} data
         * @memberof common.TestS
         * @instance
         */
        TestS.prototype.data = 0;

        /**
         * Creates a new TestS instance using the specified properties.
         * @function create
         * @memberof common.TestS
         * @static
         * @param {common.ITestS=} [properties] Properties to set
         * @returns {common.TestS} TestS instance
         */
        TestS.create = function create(properties) {
            return new TestS(properties);
        };

        /**
         * Encodes the specified TestS message. Does not implicitly {@link common.TestS.verify|verify} messages.
         * @function encode
         * @memberof common.TestS
         * @static
         * @param {common.ITestS} message TestS message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TestS.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.data);
            return writer;
        };

        /**
         * Encodes the specified TestS message, length delimited. Does not implicitly {@link common.TestS.verify|verify} messages.
         * @function encodeDelimited
         * @memberof common.TestS
         * @static
         * @param {common.ITestS} message TestS message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TestS.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a TestS message from the specified reader or buffer.
         * @function decode
         * @memberof common.TestS
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {common.TestS} TestS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TestS.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.common.TestS();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.data = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a TestS message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof common.TestS
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {common.TestS} TestS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TestS.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TestS message.
         * @function verify
         * @memberof common.TestS
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TestS.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isInteger(message.data))
                    return "data: integer expected";
            return null;
        };

        /**
         * Creates a TestS message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof common.TestS
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {common.TestS} TestS
         */
        TestS.fromObject = function fromObject(object) {
            if (object instanceof $root.common.TestS)
                return object;
            let message = new $root.common.TestS();
            if (object.data != null)
                message.data = object.data | 0;
            return message;
        };

        /**
         * Creates a plain object from a TestS message. Also converts values to other types if specified.
         * @function toObject
         * @memberof common.TestS
         * @static
         * @param {common.TestS} message TestS
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TestS.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.data = 0;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this TestS to JSON.
         * @function toJSON
         * @memberof common.TestS
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TestS.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for TestS
         * @function getTypeUrl
         * @memberof common.TestS
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TestS.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/common.TestS";
        };

        return TestS;
    })();

    common.Test2B = (function() {

        /**
         * Properties of a Test2B.
         * @memberof common
         * @interface ITest2B
         * @property {string|null} [data] Test2B data
         */

        /**
         * Constructs a new Test2B.
         * @memberof common
         * @classdesc Represents a Test2B.
         * @implements ITest2B
         * @constructor
         * @param {common.ITest2B=} [properties] Properties to set
         */
        function Test2B(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Test2B data.
         * @member {string} data
         * @memberof common.Test2B
         * @instance
         */
        Test2B.prototype.data = "";

        /**
         * Creates a new Test2B instance using the specified properties.
         * @function create
         * @memberof common.Test2B
         * @static
         * @param {common.ITest2B=} [properties] Properties to set
         * @returns {common.Test2B} Test2B instance
         */
        Test2B.create = function create(properties) {
            return new Test2B(properties);
        };

        /**
         * Encodes the specified Test2B message. Does not implicitly {@link common.Test2B.verify|verify} messages.
         * @function encode
         * @memberof common.Test2B
         * @static
         * @param {common.ITest2B} message Test2B message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Test2B.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified Test2B message, length delimited. Does not implicitly {@link common.Test2B.verify|verify} messages.
         * @function encodeDelimited
         * @memberof common.Test2B
         * @static
         * @param {common.ITest2B} message Test2B message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Test2B.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Test2B message from the specified reader or buffer.
         * @function decode
         * @memberof common.Test2B
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {common.Test2B} Test2B
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Test2B.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.common.Test2B();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.data = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Test2B message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof common.Test2B
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {common.Test2B} Test2B
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Test2B.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Test2B message.
         * @function verify
         * @memberof common.Test2B
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Test2B.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            return null;
        };

        /**
         * Creates a Test2B message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof common.Test2B
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {common.Test2B} Test2B
         */
        Test2B.fromObject = function fromObject(object) {
            if (object instanceof $root.common.Test2B)
                return object;
            let message = new $root.common.Test2B();
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a plain object from a Test2B message. Also converts values to other types if specified.
         * @function toObject
         * @memberof common.Test2B
         * @static
         * @param {common.Test2B} message Test2B
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Test2B.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.data = "";
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this Test2B to JSON.
         * @function toJSON
         * @memberof common.Test2B
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Test2B.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Test2B
         * @function getTypeUrl
         * @memberof common.Test2B
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Test2B.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/common.Test2B";
        };

        return Test2B;
    })();

    return common;
})();

export { $root as default };
