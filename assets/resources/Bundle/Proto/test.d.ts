import type { Long } from "protobufjs";
// DO NOT EDIT! This is a generated file. Edit the JSDoc in src/*.js instead and run 'npm run build:types'.

/** Namespace test. */
export namespace test {

    /** Properties of a test_c. */
    interface Itest_c {

        /** test_c __id */
        __id?: (number|Long|null);

        /** test_c __sequence */
        __sequence?: (number|null);

        /** test_c data */
        data?: (string|null);
    }

    /** Represents a test_c. */
    class test_c implements Itest_c {

        /**
         * Constructs a new test_c.
         * @param [properties] Properties to set
         */
        constructor(properties?: test.Itest_c);

        /** test_c __id. */
        public __id: (number|Long);

        /** test_c __sequence. */
        public __sequence: number;

        /** test_c data. */
        public data: string;

        /**
         * Creates a new test_c instance using the specified properties.
         * @param [properties] Properties to set
         * @returns test_c instance
         */
        public static create(properties?: test.Itest_c): test.test_c;

        /**
         * Encodes the specified test_c message. Does not implicitly {@link test.test_c.verify|verify} messages.
         * @param message test_c message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: test.Itest_c, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Encodes the specified test_c message, length delimited. Does not implicitly {@link test.test_c.verify|verify} messages.
         * @param message test_c message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: test.Itest_c, writer?: protobuf.Writer): protobuf.Writer;

        /**
         * Decodes a test_c message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns test_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: (protobuf.Reader|Uint8Array), length?: number): test.test_c;

        /**
         * Decodes a test_c message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns test_c
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: (protobuf.Reader|Uint8Array)): test.test_c;

        /**
         * Verifies a test_c message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a test_c message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns test_c
         */
        public static fromObject(object: { [k: string]: any }): test.test_c;

        /**
         * Creates a plain object from a test_c message. Also converts values to other types if specified.
         * @param message test_c
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: test.test_c, options?: protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this test_c to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for test_c
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
