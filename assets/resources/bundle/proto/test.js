/*eslint-disable*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = {};

export const test = $root.test = (() => {

    /**
     * Namespace test.
     * @exports test
     * @namespace
     */
    const test = {};

    test.test_c = (function() {

        /**
         * Properties of a test_c.
         * @memberof test
         * @interface Itest_c
         * @property {number|null} [__id] test_c __id
         * @property {string|null} [data] test_c data
         */

        /**
         * Constructs a new test_c.
         * @memberof test
         * @classdesc Represents a test_c.
         * @implements Itest_c
         * @constructor
         * @param {test.Itest_c=} [properties] Properties to set
         */
        function test_c(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * test_c __id.
         * @member {number} __id
         * @memberof test.test_c
         * @instance
         */
        test_c.prototype.__id = 100;

        /**
         * test_c data.
         * @member {string} data
         * @memberof test.test_c
         * @instance
         */
        test_c.prototype.data = "";

        /**
         * Creates a new test_c instance using the specified properties.
         * @function create
         * @memberof test.test_c
         * @static
         * @param {test.Itest_c=} [properties] Properties to set
         * @returns {test.test_c} test_c instance
         */
        test_c.create = function create(properties) {
            return new test_c(properties);
        };

        /**
         * Encodes the specified test_c message. Does not implicitly {@link test.test_c.verify|verify} messages.
         * @function encode
         * @memberof test.test_c
         * @static
         * @param {test.Itest_c} message test_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test_c.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.__id != null && Object.hasOwnProperty.call(message, "__id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.__id);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified test_c message, length delimited. Does not implicitly {@link test.test_c.verify|verify} messages.
         * @function encodeDelimited
         * @memberof test.test_c
         * @static
         * @param {test.Itest_c} message test_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test_c.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a test_c message from the specified reader or buffer.
         * @function decode
         * @memberof test.test_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {test.test_c} test_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test_c.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test_c();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.__id = reader.uint32();
                        break;
                    }
                case 2: {
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
         * Decodes a test_c message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof test.test_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {test.test_c} test_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test_c.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a test_c message.
         * @function verify
         * @memberof test.test_c
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        test_c.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.__id != null && message.hasOwnProperty("__id"))
                if (!$util.isInteger(message.__id))
                    return "__id: integer expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            return null;
        };

        /**
         * Creates a test_c message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof test.test_c
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {test.test_c} test_c
         */
        test_c.fromObject = function fromObject(object) {
            if (object instanceof $root.test.test_c)
                return object;
            let message = new $root.test.test_c();
            if (object.__id != null)
                message.__id = object.__id >>> 0;
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a plain object from a test_c message. Also converts values to other types if specified.
         * @function toObject
         * @memberof test.test_c
         * @static
         * @param {test.test_c} message test_c
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        test_c.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.__id = 100;
                object.data = "";
            }
            if (message.__id != null && message.hasOwnProperty("__id"))
                object.__id = message.__id;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this test_c to JSON.
         * @function toJSON
         * @memberof test.test_c
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        test_c.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for test_c
         * @function getTypeUrl
         * @memberof test.test_c
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        test_c.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/test.test_c";
        };

        return test_c;
    })();

    test.test22_c = (function() {

        /**
         * Properties of a test22_c.
         * @memberof test
         * @interface Itest22_c
         * @property {number|null} [__id] test22_c __id
         * @property {string|null} [data3] test22_c data3
         * @property {number|Long|null} [data4] test22_c data4
         */

        /**
         * Constructs a new test22_c.
         * @memberof test
         * @classdesc Represents a test22_c.
         * @implements Itest22_c
         * @constructor
         * @param {test.Itest22_c=} [properties] Properties to set
         */
        function test22_c(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * test22_c __id.
         * @member {number} __id
         * @memberof test.test22_c
         * @instance
         */
        test22_c.prototype.__id = 101;

        /**
         * test22_c data3.
         * @member {string} data3
         * @memberof test.test22_c
         * @instance
         */
        test22_c.prototype.data3 = "";

        /**
         * test22_c data4.
         * @member {number|Long} data4
         * @memberof test.test22_c
         * @instance
         */
        test22_c.prototype.data4 = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new test22_c instance using the specified properties.
         * @function create
         * @memberof test.test22_c
         * @static
         * @param {test.Itest22_c=} [properties] Properties to set
         * @returns {test.test22_c} test22_c instance
         */
        test22_c.create = function create(properties) {
            return new test22_c(properties);
        };

        /**
         * Encodes the specified test22_c message. Does not implicitly {@link test.test22_c.verify|verify} messages.
         * @function encode
         * @memberof test.test22_c
         * @static
         * @param {test.Itest22_c} message test22_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test22_c.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.__id != null && Object.hasOwnProperty.call(message, "__id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.__id);
            if (message.data3 != null && Object.hasOwnProperty.call(message, "data3"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.data3);
            if (message.data4 != null && Object.hasOwnProperty.call(message, "data4"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.data4);
            return writer;
        };

        /**
         * Encodes the specified test22_c message, length delimited. Does not implicitly {@link test.test22_c.verify|verify} messages.
         * @function encodeDelimited
         * @memberof test.test22_c
         * @static
         * @param {test.Itest22_c} message test22_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test22_c.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a test22_c message from the specified reader or buffer.
         * @function decode
         * @memberof test.test22_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {test.test22_c} test22_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test22_c.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test22_c();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.__id = reader.uint32();
                        break;
                    }
                case 2: {
                        message.data3 = reader.string();
                        break;
                    }
                case 3: {
                        message.data4 = reader.int64();
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
         * Decodes a test22_c message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof test.test22_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {test.test22_c} test22_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test22_c.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a test22_c message.
         * @function verify
         * @memberof test.test22_c
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        test22_c.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.__id != null && message.hasOwnProperty("__id"))
                if (!$util.isInteger(message.__id))
                    return "__id: integer expected";
            if (message.data3 != null && message.hasOwnProperty("data3"))
                if (!$util.isString(message.data3))
                    return "data3: string expected";
            if (message.data4 != null && message.hasOwnProperty("data4"))
                if (!$util.isInteger(message.data4) && !(message.data4 && $util.isInteger(message.data4.low) && $util.isInteger(message.data4.high)))
                    return "data4: integer|Long expected";
            return null;
        };

        /**
         * Creates a test22_c message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof test.test22_c
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {test.test22_c} test22_c
         */
        test22_c.fromObject = function fromObject(object) {
            if (object instanceof $root.test.test22_c)
                return object;
            let message = new $root.test.test22_c();
            if (object.__id != null)
                message.__id = object.__id >>> 0;
            if (object.data3 != null)
                message.data3 = String(object.data3);
            if (object.data4 != null)
                if ($util.Long)
                    (message.data4 = $util.Long.fromValue(object.data4)).unsigned = false;
                else if (typeof object.data4 === "string")
                    message.data4 = parseInt(object.data4, 10);
                else if (typeof object.data4 === "number")
                    message.data4 = object.data4;
                else if (typeof object.data4 === "object")
                    message.data4 = new $util.LongBits(object.data4.low >>> 0, object.data4.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a test22_c message. Also converts values to other types if specified.
         * @function toObject
         * @memberof test.test22_c
         * @static
         * @param {test.test22_c} message test22_c
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        test22_c.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.__id = 101;
                object.data3 = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.data4 = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.data4 = options.longs === String ? "0" : 0;
            }
            if (message.__id != null && message.hasOwnProperty("__id"))
                object.__id = message.__id;
            if (message.data3 != null && message.hasOwnProperty("data3"))
                object.data3 = message.data3;
            if (message.data4 != null && message.hasOwnProperty("data4"))
                if (typeof message.data4 === "number")
                    object.data4 = options.longs === String ? String(message.data4) : message.data4;
                else
                    object.data4 = options.longs === String ? $util.Long.prototype.toString.call(message.data4) : options.longs === Number ? new $util.LongBits(message.data4.low >>> 0, message.data4.high >>> 0).toNumber() : message.data4;
            return object;
        };

        /**
         * Converts this test22_c to JSON.
         * @function toJSON
         * @memberof test.test22_c
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        test22_c.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for test22_c
         * @function getTypeUrl
         * @memberof test.test22_c
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        test22_c.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/test.test22_c";
        };

        test22_c.MessageName = (function() {

            /**
             * Properties of a MessageName.
             * @memberof test.test22_c
             * @interface IMessageName
             * @property {string|null} [test4] MessageName test4
             */

            /**
             * Constructs a new MessageName.
             * @memberof test.test22_c
             * @classdesc Represents a MessageName.
             * @implements IMessageName
             * @constructor
             * @param {test.test22_c.IMessageName=} [properties] Properties to set
             */
            function MessageName(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MessageName test4.
             * @member {string} test4
             * @memberof test.test22_c.MessageName
             * @instance
             */
            MessageName.prototype.test4 = "";

            /**
             * Creates a new MessageName instance using the specified properties.
             * @function create
             * @memberof test.test22_c.MessageName
             * @static
             * @param {test.test22_c.IMessageName=} [properties] Properties to set
             * @returns {test.test22_c.MessageName} MessageName instance
             */
            MessageName.create = function create(properties) {
                return new MessageName(properties);
            };

            /**
             * Encodes the specified MessageName message. Does not implicitly {@link test.test22_c.MessageName.verify|verify} messages.
             * @function encode
             * @memberof test.test22_c.MessageName
             * @static
             * @param {test.test22_c.IMessageName} message MessageName message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageName.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.test4 != null && Object.hasOwnProperty.call(message, "test4"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.test4);
                return writer;
            };

            /**
             * Encodes the specified MessageName message, length delimited. Does not implicitly {@link test.test22_c.MessageName.verify|verify} messages.
             * @function encodeDelimited
             * @memberof test.test22_c.MessageName
             * @static
             * @param {test.test22_c.IMessageName} message MessageName message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageName.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MessageName message from the specified reader or buffer.
             * @function decode
             * @memberof test.test22_c.MessageName
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {test.test22_c.MessageName} MessageName
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageName.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test22_c.MessageName();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1: {
                            message.test4 = reader.string();
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
             * Decodes a MessageName message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof test.test22_c.MessageName
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {test.test22_c.MessageName} MessageName
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageName.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MessageName message.
             * @function verify
             * @memberof test.test22_c.MessageName
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MessageName.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.test4 != null && message.hasOwnProperty("test4"))
                    if (!$util.isString(message.test4))
                        return "test4: string expected";
                return null;
            };

            /**
             * Creates a MessageName message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof test.test22_c.MessageName
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {test.test22_c.MessageName} MessageName
             */
            MessageName.fromObject = function fromObject(object) {
                if (object instanceof $root.test.test22_c.MessageName)
                    return object;
                let message = new $root.test.test22_c.MessageName();
                if (object.test4 != null)
                    message.test4 = String(object.test4);
                return message;
            };

            /**
             * Creates a plain object from a MessageName message. Also converts values to other types if specified.
             * @function toObject
             * @memberof test.test22_c.MessageName
             * @static
             * @param {test.test22_c.MessageName} message MessageName
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MessageName.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.test4 = "";
                if (message.test4 != null && message.hasOwnProperty("test4"))
                    object.test4 = message.test4;
                return object;
            };

            /**
             * Converts this MessageName to JSON.
             * @function toJSON
             * @memberof test.test22_c.MessageName
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MessageName.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MessageName
             * @function getTypeUrl
             * @memberof test.test22_c.MessageName
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MessageName.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/test.test22_c.MessageName";
            };

            return MessageName;
        })();

        return test22_c;
    })();

    test.test22442_c = (function() {

        /**
         * Properties of a test22442_c.
         * @memberof test
         * @interface Itest22442_c
         * @property {number|null} [__id] test22442_c __id
         * @property {string|null} [data3] test22442_c data3
         * @property {number|Long|null} [data4] test22442_c data4
         */

        /**
         * Constructs a new test22442_c.
         * @memberof test
         * @classdesc Represents a test22442_c.
         * @implements Itest22442_c
         * @constructor
         * @param {test.Itest22442_c=} [properties] Properties to set
         */
        function test22442_c(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * test22442_c __id.
         * @member {number} __id
         * @memberof test.test22442_c
         * @instance
         */
        test22442_c.prototype.__id = 104;

        /**
         * test22442_c data3.
         * @member {string} data3
         * @memberof test.test22442_c
         * @instance
         */
        test22442_c.prototype.data3 = "";

        /**
         * test22442_c data4.
         * @member {number|Long} data4
         * @memberof test.test22442_c
         * @instance
         */
        test22442_c.prototype.data4 = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new test22442_c instance using the specified properties.
         * @function create
         * @memberof test.test22442_c
         * @static
         * @param {test.Itest22442_c=} [properties] Properties to set
         * @returns {test.test22442_c} test22442_c instance
         */
        test22442_c.create = function create(properties) {
            return new test22442_c(properties);
        };

        /**
         * Encodes the specified test22442_c message. Does not implicitly {@link test.test22442_c.verify|verify} messages.
         * @function encode
         * @memberof test.test22442_c
         * @static
         * @param {test.Itest22442_c} message test22442_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test22442_c.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.__id != null && Object.hasOwnProperty.call(message, "__id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.__id);
            if (message.data3 != null && Object.hasOwnProperty.call(message, "data3"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.data3);
            if (message.data4 != null && Object.hasOwnProperty.call(message, "data4"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.data4);
            return writer;
        };

        /**
         * Encodes the specified test22442_c message, length delimited. Does not implicitly {@link test.test22442_c.verify|verify} messages.
         * @function encodeDelimited
         * @memberof test.test22442_c
         * @static
         * @param {test.Itest22442_c} message test22442_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test22442_c.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a test22442_c message from the specified reader or buffer.
         * @function decode
         * @memberof test.test22442_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {test.test22442_c} test22442_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test22442_c.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test22442_c();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.__id = reader.uint32();
                        break;
                    }
                case 2: {
                        message.data3 = reader.string();
                        break;
                    }
                case 3: {
                        message.data4 = reader.int64();
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
         * Decodes a test22442_c message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof test.test22442_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {test.test22442_c} test22442_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test22442_c.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a test22442_c message.
         * @function verify
         * @memberof test.test22442_c
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        test22442_c.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.__id != null && message.hasOwnProperty("__id"))
                if (!$util.isInteger(message.__id))
                    return "__id: integer expected";
            if (message.data3 != null && message.hasOwnProperty("data3"))
                if (!$util.isString(message.data3))
                    return "data3: string expected";
            if (message.data4 != null && message.hasOwnProperty("data4"))
                if (!$util.isInteger(message.data4) && !(message.data4 && $util.isInteger(message.data4.low) && $util.isInteger(message.data4.high)))
                    return "data4: integer|Long expected";
            return null;
        };

        /**
         * Creates a test22442_c message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof test.test22442_c
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {test.test22442_c} test22442_c
         */
        test22442_c.fromObject = function fromObject(object) {
            if (object instanceof $root.test.test22442_c)
                return object;
            let message = new $root.test.test22442_c();
            if (object.__id != null)
                message.__id = object.__id >>> 0;
            if (object.data3 != null)
                message.data3 = String(object.data3);
            if (object.data4 != null)
                if ($util.Long)
                    (message.data4 = $util.Long.fromValue(object.data4)).unsigned = false;
                else if (typeof object.data4 === "string")
                    message.data4 = parseInt(object.data4, 10);
                else if (typeof object.data4 === "number")
                    message.data4 = object.data4;
                else if (typeof object.data4 === "object")
                    message.data4 = new $util.LongBits(object.data4.low >>> 0, object.data4.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a test22442_c message. Also converts values to other types if specified.
         * @function toObject
         * @memberof test.test22442_c
         * @static
         * @param {test.test22442_c} message test22442_c
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        test22442_c.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.__id = 104;
                object.data3 = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.data4 = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.data4 = options.longs === String ? "0" : 0;
            }
            if (message.__id != null && message.hasOwnProperty("__id"))
                object.__id = message.__id;
            if (message.data3 != null && message.hasOwnProperty("data3"))
                object.data3 = message.data3;
            if (message.data4 != null && message.hasOwnProperty("data4"))
                if (typeof message.data4 === "number")
                    object.data4 = options.longs === String ? String(message.data4) : message.data4;
                else
                    object.data4 = options.longs === String ? $util.Long.prototype.toString.call(message.data4) : options.longs === Number ? new $util.LongBits(message.data4.low >>> 0, message.data4.high >>> 0).toNumber() : message.data4;
            return object;
        };

        /**
         * Converts this test22442_c to JSON.
         * @function toJSON
         * @memberof test.test22442_c
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        test22442_c.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for test22442_c
         * @function getTypeUrl
         * @memberof test.test22442_c
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        test22442_c.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/test.test22442_c";
        };

        test22442_c.MessageName = (function() {

            /**
             * Properties of a MessageName.
             * @memberof test.test22442_c
             * @interface IMessageName
             * @property {string|null} [test4] MessageName test4
             */

            /**
             * Constructs a new MessageName.
             * @memberof test.test22442_c
             * @classdesc Represents a MessageName.
             * @implements IMessageName
             * @constructor
             * @param {test.test22442_c.IMessageName=} [properties] Properties to set
             */
            function MessageName(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MessageName test4.
             * @member {string} test4
             * @memberof test.test22442_c.MessageName
             * @instance
             */
            MessageName.prototype.test4 = "";

            /**
             * Creates a new MessageName instance using the specified properties.
             * @function create
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {test.test22442_c.IMessageName=} [properties] Properties to set
             * @returns {test.test22442_c.MessageName} MessageName instance
             */
            MessageName.create = function create(properties) {
                return new MessageName(properties);
            };

            /**
             * Encodes the specified MessageName message. Does not implicitly {@link test.test22442_c.MessageName.verify|verify} messages.
             * @function encode
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {test.test22442_c.IMessageName} message MessageName message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageName.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.test4 != null && Object.hasOwnProperty.call(message, "test4"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.test4);
                return writer;
            };

            /**
             * Encodes the specified MessageName message, length delimited. Does not implicitly {@link test.test22442_c.MessageName.verify|verify} messages.
             * @function encodeDelimited
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {test.test22442_c.IMessageName} message MessageName message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageName.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MessageName message from the specified reader or buffer.
             * @function decode
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {test.test22442_c.MessageName} MessageName
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageName.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test22442_c.MessageName();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1: {
                            message.test4 = reader.string();
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
             * Decodes a MessageName message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {test.test22442_c.MessageName} MessageName
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageName.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MessageName message.
             * @function verify
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MessageName.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.test4 != null && message.hasOwnProperty("test4"))
                    if (!$util.isString(message.test4))
                        return "test4: string expected";
                return null;
            };

            /**
             * Creates a MessageName message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {test.test22442_c.MessageName} MessageName
             */
            MessageName.fromObject = function fromObject(object) {
                if (object instanceof $root.test.test22442_c.MessageName)
                    return object;
                let message = new $root.test.test22442_c.MessageName();
                if (object.test4 != null)
                    message.test4 = String(object.test4);
                return message;
            };

            /**
             * Creates a plain object from a MessageName message. Also converts values to other types if specified.
             * @function toObject
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {test.test22442_c.MessageName} message MessageName
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MessageName.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults)
                    object.test4 = "";
                if (message.test4 != null && message.hasOwnProperty("test4"))
                    object.test4 = message.test4;
                return object;
            };

            /**
             * Converts this MessageName to JSON.
             * @function toJSON
             * @memberof test.test22442_c.MessageName
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MessageName.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MessageName
             * @function getTypeUrl
             * @memberof test.test22442_c.MessageName
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MessageName.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/test.test22442_c.MessageName";
            };

            return MessageName;
        })();

        return test22442_c;
    })();

    test.test2_c = (function() {

        /**
         * Properties of a test2_c.
         * @memberof test
         * @interface Itest2_c
         * @property {number|null} [__id] test2_c __id
         * @property {string|null} [data] test2_c data
         */

        /**
         * Constructs a new test2_c.
         * @memberof test
         * @classdesc Represents a test2_c.
         * @implements Itest2_c
         * @constructor
         * @param {test.Itest2_c=} [properties] Properties to set
         */
        function test2_c(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * test2_c __id.
         * @member {number} __id
         * @memberof test.test2_c
         * @instance
         */
        test2_c.prototype.__id = 103;

        /**
         * test2_c data.
         * @member {string} data
         * @memberof test.test2_c
         * @instance
         */
        test2_c.prototype.data = "";

        /**
         * Creates a new test2_c instance using the specified properties.
         * @function create
         * @memberof test.test2_c
         * @static
         * @param {test.Itest2_c=} [properties] Properties to set
         * @returns {test.test2_c} test2_c instance
         */
        test2_c.create = function create(properties) {
            return new test2_c(properties);
        };

        /**
         * Encodes the specified test2_c message. Does not implicitly {@link test.test2_c.verify|verify} messages.
         * @function encode
         * @memberof test.test2_c
         * @static
         * @param {test.Itest2_c} message test2_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test2_c.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.__id != null && Object.hasOwnProperty.call(message, "__id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.__id);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified test2_c message, length delimited. Does not implicitly {@link test.test2_c.verify|verify} messages.
         * @function encodeDelimited
         * @memberof test.test2_c
         * @static
         * @param {test.Itest2_c} message test2_c message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        test2_c.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a test2_c message from the specified reader or buffer.
         * @function decode
         * @memberof test.test2_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {test.test2_c} test2_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test2_c.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.test2_c();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.__id = reader.uint32();
                        break;
                    }
                case 2: {
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
         * Decodes a test2_c message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof test.test2_c
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {test.test2_c} test2_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        test2_c.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a test2_c message.
         * @function verify
         * @memberof test.test2_c
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        test2_c.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.__id != null && message.hasOwnProperty("__id"))
                if (!$util.isInteger(message.__id))
                    return "__id: integer expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            return null;
        };

        /**
         * Creates a test2_c message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof test.test2_c
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {test.test2_c} test2_c
         */
        test2_c.fromObject = function fromObject(object) {
            if (object instanceof $root.test.test2_c)
                return object;
            let message = new $root.test.test2_c();
            if (object.__id != null)
                message.__id = object.__id >>> 0;
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a plain object from a test2_c message. Also converts values to other types if specified.
         * @function toObject
         * @memberof test.test2_c
         * @static
         * @param {test.test2_c} message test2_c
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        test2_c.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.__id = 103;
                object.data = "";
            }
            if (message.__id != null && message.hasOwnProperty("__id"))
                object.__id = message.__id;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Converts this test2_c to JSON.
         * @function toJSON
         * @memberof test.test2_c
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        test2_c.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for test2_c
         * @function getTypeUrl
         * @memberof test.test2_c
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        test2_c.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/test.test2_c";
        };

        return test2_c;
    })();

    test.child = (function() {

        /**
         * Namespace child.
         * @memberof test
         * @namespace
         */
        const child = {};

        child.test3 = (function() {

            /**
             * Properties of a test3.
             * @memberof test.child
             * @interface Itest3
             * @property {string|null} [data] test3 data
             */

            /**
             * Constructs a new test3.
             * @memberof test.child
             * @classdesc Represents a test3.
             * @implements Itest3
             * @constructor
             * @param {test.child.Itest3=} [properties] Properties to set
             */
            function test3(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * test3 data.
             * @member {string} data
             * @memberof test.child.test3
             * @instance
             */
            test3.prototype.data = "";

            /**
             * Creates a new test3 instance using the specified properties.
             * @function create
             * @memberof test.child.test3
             * @static
             * @param {test.child.Itest3=} [properties] Properties to set
             * @returns {test.child.test3} test3 instance
             */
            test3.create = function create(properties) {
                return new test3(properties);
            };

            /**
             * Encodes the specified test3 message. Does not implicitly {@link test.child.test3.verify|verify} messages.
             * @function encode
             * @memberof test.child.test3
             * @static
             * @param {test.child.Itest3} message test3 message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            test3.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.data);
                return writer;
            };

            /**
             * Encodes the specified test3 message, length delimited. Does not implicitly {@link test.child.test3.verify|verify} messages.
             * @function encodeDelimited
             * @memberof test.child.test3
             * @static
             * @param {test.child.Itest3} message test3 message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            test3.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a test3 message from the specified reader or buffer.
             * @function decode
             * @memberof test.child.test3
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {test.child.test3} test3
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            test3.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.test.child.test3();
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
             * Decodes a test3 message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof test.child.test3
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {test.child.test3} test3
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            test3.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a test3 message.
             * @function verify
             * @memberof test.child.test3
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            test3.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.data != null && message.hasOwnProperty("data"))
                    if (!$util.isString(message.data))
                        return "data: string expected";
                return null;
            };

            /**
             * Creates a test3 message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof test.child.test3
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {test.child.test3} test3
             */
            test3.fromObject = function fromObject(object) {
                if (object instanceof $root.test.child.test3)
                    return object;
                let message = new $root.test.child.test3();
                if (object.data != null)
                    message.data = String(object.data);
                return message;
            };

            /**
             * Creates a plain object from a test3 message. Also converts values to other types if specified.
             * @function toObject
             * @memberof test.child.test3
             * @static
             * @param {test.child.test3} message test3
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            test3.toObject = function toObject(message, options) {
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
             * Converts this test3 to JSON.
             * @function toJSON
             * @memberof test.child.test3
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            test3.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for test3
             * @function getTypeUrl
             * @memberof test.child.test3
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            test3.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/test.child.test3";
            };

            return test3;
        })();

        return child;
    })();

    return test;
})();

export { $root as default };
