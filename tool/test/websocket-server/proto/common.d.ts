import type { Long } from "protobufjs";
// DO NOT EDIT! This is a generated file. Edit the JSDoc in src/*.js instead and run 'npm run build:types'.

/** Namespace common. */
export namespace common {

    /** MessageID enum. */
    enum MessageID {
        Test = 0,
        Test2 = 1
    }

    /** Properties of a Package. */
    interface IPackage {

        /** 消息号 */
        id?: (number|null);

        /** 消息序列号 */
        sequence?: (number|null);

        /** 消息体 */
        data?: (Uint8Array|null);
    }

    /** Represents a Package. */
    class Package implements IPackage {

        /**
         * Constructs a new Package.
         * @param [properties] Properties to set
         */
        constructor(properties?: common.IPackage);

        /** 消息号 */
        public id: number;

        /** 消息序列号 */
        public sequence: number;

        /** 消息体 */
        public data: Uint8Array;

        /**
         * Creates a new Package instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Package instance
         */
        public static create(properties?: common.IPackage): common.Package;

        /**
         * Encodes the specified Package message. Does not implicitly {@link common.Package.verify|verify} messages.
         * @param message Package message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: common.IPackage, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Encodes the specified Package message, length delimited. Does not implicitly {@link common.Package.verify|verify} messages.
         * @param message Package message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: common.IPackage, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Decodes a Package message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Package
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: (protobuf.Reader|Uint8Array), length?: number): common.Package;

        /**
         * Decodes a Package message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Package
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: (protobuf.Reader|Uint8Array)): common.Package;

        /**
         * Verifies a Package message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Package message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Package
         */
        public static fromObject(object: { [k: string]: any }): common.Package;

        /**
         * Creates a plain object from a Package message. Also converts values to other types if specified.
         * @param message Package
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: common.Package, options?: protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Package to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Package
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a TestC. */
    interface ITestC {

        /** TestC data */
        data?: (number|null);
    }

    /** Represents a TestC. */
    class TestC implements ITestC {

        /**
         * Constructs a new TestC.
         * @param [properties] Properties to set
         */
        constructor(properties?: common.ITestC);

        /** TestC data. */
        public data: number;

        /**
         * Creates a new TestC instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TestC instance
         */
        public static create(properties?: common.ITestC): common.TestC;

        /**
         * Encodes the specified TestC message. Does not implicitly {@link common.TestC.verify|verify} messages.
         * @param message TestC message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: common.ITestC, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Encodes the specified TestC message, length delimited. Does not implicitly {@link common.TestC.verify|verify} messages.
         * @param message TestC message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: common.ITestC, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Decodes a TestC message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TestC
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: (protobuf.Reader|Uint8Array), length?: number): common.TestC;

        /**
         * Decodes a TestC message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TestC
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: (protobuf.Reader|Uint8Array)): common.TestC;

        /**
         * Verifies a TestC message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TestC message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TestC
         */
        public static fromObject(object: { [k: string]: any }): common.TestC;

        /**
         * Creates a plain object from a TestC message. Also converts values to other types if specified.
         * @param message TestC
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: common.TestC, options?: protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TestC to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TestC
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a TestS. */
    interface ITestS {

        /** TestS data */
        data?: (number|null);
    }

    /** Represents a TestS. */
    class TestS implements ITestS {

        /**
         * Constructs a new TestS.
         * @param [properties] Properties to set
         */
        constructor(properties?: common.ITestS);

        /** TestS data. */
        public data: number;

        /**
         * Creates a new TestS instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TestS instance
         */
        public static create(properties?: common.ITestS): common.TestS;

        /**
         * Encodes the specified TestS message. Does not implicitly {@link common.TestS.verify|verify} messages.
         * @param message TestS message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: common.ITestS, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Encodes the specified TestS message, length delimited. Does not implicitly {@link common.TestS.verify|verify} messages.
         * @param message TestS message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: common.ITestS, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Decodes a TestS message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TestS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: (protobuf.Reader|Uint8Array), length?: number): common.TestS;

        /**
         * Decodes a TestS message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TestS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: (protobuf.Reader|Uint8Array)): common.TestS;

        /**
         * Verifies a TestS message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TestS message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TestS
         */
        public static fromObject(object: { [k: string]: any }): common.TestS;

        /**
         * Creates a plain object from a TestS message. Also converts values to other types if specified.
         * @param message TestS
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: common.TestS, options?: protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TestS to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TestS
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Test2B. */
    interface ITest2B {

        /** Test2B data */
        data?: (string|null);
    }

    /** Represents a Test2B. */
    class Test2B implements ITest2B {

        /**
         * Constructs a new Test2B.
         * @param [properties] Properties to set
         */
        constructor(properties?: common.ITest2B);

        /** Test2B data. */
        public data: string;

        /**
         * Creates a new Test2B instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Test2B instance
         */
        public static create(properties?: common.ITest2B): common.Test2B;

        /**
         * Encodes the specified Test2B message. Does not implicitly {@link common.Test2B.verify|verify} messages.
         * @param message Test2B message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: common.ITest2B, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Encodes the specified Test2B message, length delimited. Does not implicitly {@link common.Test2B.verify|verify} messages.
         * @param message Test2B message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: common.ITest2B, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Decodes a Test2B message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Test2B
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: (protobuf.Reader|Uint8Array), length?: number): common.Test2B;

        /**
         * Decodes a Test2B message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Test2B
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: (protobuf.Reader|Uint8Array)): common.Test2B;

        /**
         * Verifies a Test2B message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Test2B message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Test2B
         */
        public static fromObject(object: { [k: string]: any }): common.Test2B;

        /**
         * Creates a plain object from a Test2B message. Also converts values to other types if specified.
         * @param message Test2B
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: common.Test2B, options?: protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Test2B to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Test2B
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
