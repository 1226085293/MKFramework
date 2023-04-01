// DO NOT EDIT! This is a generated file. Edit the JSDoc in src/*.js instead and run 'npm run build:types'.

/** Namespace test. */
export namespace test {
	/** Properties of a test_c. */
	interface Itest_c {
		/** test_c __id */
		__id?: number | null;

		/** test_c data */
		data?: string | null;
	}

	/** Represents a test_c. */
	class test_c implements Itest_c {
		/**
		 * Constructs a new test_c.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: test.Itest_c);

		/** test_c __id. */
		public __id: number;

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
		public static encode(message: test.Itest_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified test_c message, length delimited. Does not implicitly {@link test.test_c.verify|verify} messages.
		 * @param message test_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: test.Itest_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a test_c message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns test_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.test_c;

		/**
		 * Decodes a test_c message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns test_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.test_c;

		/**
		 * Verifies a test_c message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

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
		public static toObject(message: test.test_c, options?: $protobuf.IConversionOptions): { [k: string]: any };

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

	/** Properties of a test22_c. */
	interface Itest22_c {
		/** test22_c __id */
		__id?: number | null;

		/** test22_c data3 */
		data3?: string | null;

		/** test22_c data4 */
		data4?: number | Long | null;
	}

	/** Represents a test22_c. */
	class test22_c implements Itest22_c {
		/**
		 * Constructs a new test22_c.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: test.Itest22_c);

		/** test22_c __id. */
		public __id: number;

		/** test22_c data3. */
		public data3: string;

		/** test22_c data4. */
		public data4: number | Long;

		/**
		 * Creates a new test22_c instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns test22_c instance
		 */
		public static create(properties?: test.Itest22_c): test.test22_c;

		/**
		 * Encodes the specified test22_c message. Does not implicitly {@link test.test22_c.verify|verify} messages.
		 * @param message test22_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: test.Itest22_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified test22_c message, length delimited. Does not implicitly {@link test.test22_c.verify|verify} messages.
		 * @param message test22_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: test.Itest22_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a test22_c message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns test22_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.test22_c;

		/**
		 * Decodes a test22_c message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns test22_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.test22_c;

		/**
		 * Verifies a test22_c message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates a test22_c message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns test22_c
		 */
		public static fromObject(object: { [k: string]: any }): test.test22_c;

		/**
		 * Creates a plain object from a test22_c message. Also converts values to other types if specified.
		 * @param message test22_c
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(message: test.test22_c, options?: $protobuf.IConversionOptions): { [k: string]: any };

		/**
		 * Converts this test22_c to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };

		/**
		 * Gets the default type url for test22_c
		 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
		 * @returns The default type url
		 */
		public static getTypeUrl(typeUrlPrefix?: string): string;
	}

	namespace test22_c {
		/** Properties of a MessageName. */
		interface IMessageName {
			/** MessageName test4 */
			test4?: string | null;
		}

		/** Represents a MessageName. */
		class MessageName implements IMessageName {
			/**
			 * Constructs a new MessageName.
			 * @param [properties] Properties to set
			 */
			constructor(properties?: test.test22_c.IMessageName);

			/** MessageName test4. */
			public test4: string;

			/**
			 * Creates a new MessageName instance using the specified properties.
			 * @param [properties] Properties to set
			 * @returns MessageName instance
			 */
			public static create(properties?: test.test22_c.IMessageName): test.test22_c.MessageName;

			/**
			 * Encodes the specified MessageName message. Does not implicitly {@link test.test22_c.MessageName.verify|verify} messages.
			 * @param message MessageName message or plain object to encode
			 * @param [writer] Writer to encode to
			 * @returns Writer
			 */
			public static encode(message: test.test22_c.IMessageName, writer?: $protobuf.Writer): $protobuf.Writer;

			/**
			 * Encodes the specified MessageName message, length delimited. Does not implicitly {@link test.test22_c.MessageName.verify|verify} messages.
			 * @param message MessageName message or plain object to encode
			 * @param [writer] Writer to encode to
			 * @returns Writer
			 */
			public static encodeDelimited(message: test.test22_c.IMessageName, writer?: $protobuf.Writer): $protobuf.Writer;

			/**
			 * Decodes a MessageName message from the specified reader or buffer.
			 * @param reader Reader or buffer to decode from
			 * @param [length] Message length if known beforehand
			 * @returns MessageName
			 * @throws {Error} If the payload is not a reader or valid buffer
			 * @throws {$protobuf.util.ProtocolError} If required fields are missing
			 */
			public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.test22_c.MessageName;

			/**
			 * Decodes a MessageName message from the specified reader or buffer, length delimited.
			 * @param reader Reader or buffer to decode from
			 * @returns MessageName
			 * @throws {Error} If the payload is not a reader or valid buffer
			 * @throws {$protobuf.util.ProtocolError} If required fields are missing
			 */
			public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.test22_c.MessageName;

			/**
			 * Verifies a MessageName message.
			 * @param message Plain object to verify
			 * @returns `null` if valid, otherwise the reason why it is not
			 */
			public static verify(message: { [k: string]: any }): string | null;

			/**
			 * Creates a MessageName message from a plain object. Also converts values to their respective internal types.
			 * @param object Plain object
			 * @returns MessageName
			 */
			public static fromObject(object: { [k: string]: any }): test.test22_c.MessageName;

			/**
			 * Creates a plain object from a MessageName message. Also converts values to other types if specified.
			 * @param message MessageName
			 * @param [options] Conversion options
			 * @returns Plain object
			 */
			public static toObject(message: test.test22_c.MessageName, options?: $protobuf.IConversionOptions): { [k: string]: any };

			/**
			 * Converts this MessageName to JSON.
			 * @returns JSON object
			 */
			public toJSON(): { [k: string]: any };

			/**
			 * Gets the default type url for MessageName
			 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
			 * @returns The default type url
			 */
			public static getTypeUrl(typeUrlPrefix?: string): string;
		}
	}

	/** Properties of a test22442_c. */
	interface Itest22442_c {
		/** test22442_c __id */
		__id?: number | null;

		/** test22442_c data3 */
		data3?: string | null;

		/** test22442_c data4 */
		data4?: number | Long | null;
	}

	/** Represents a test22442_c. */
	class test22442_c implements Itest22442_c {
		/**
		 * Constructs a new test22442_c.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: test.Itest22442_c);

		/** test22442_c __id. */
		public __id: number;

		/** test22442_c data3. */
		public data3: string;

		/** test22442_c data4. */
		public data4: number | Long;

		/**
		 * Creates a new test22442_c instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns test22442_c instance
		 */
		public static create(properties?: test.Itest22442_c): test.test22442_c;

		/**
		 * Encodes the specified test22442_c message. Does not implicitly {@link test.test22442_c.verify|verify} messages.
		 * @param message test22442_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: test.Itest22442_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified test22442_c message, length delimited. Does not implicitly {@link test.test22442_c.verify|verify} messages.
		 * @param message test22442_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: test.Itest22442_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a test22442_c message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns test22442_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.test22442_c;

		/**
		 * Decodes a test22442_c message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns test22442_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.test22442_c;

		/**
		 * Verifies a test22442_c message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates a test22442_c message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns test22442_c
		 */
		public static fromObject(object: { [k: string]: any }): test.test22442_c;

		/**
		 * Creates a plain object from a test22442_c message. Also converts values to other types if specified.
		 * @param message test22442_c
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(message: test.test22442_c, options?: $protobuf.IConversionOptions): { [k: string]: any };

		/**
		 * Converts this test22442_c to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };

		/**
		 * Gets the default type url for test22442_c
		 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
		 * @returns The default type url
		 */
		public static getTypeUrl(typeUrlPrefix?: string): string;
	}

	namespace test22442_c {
		/** Properties of a MessageName. */
		interface IMessageName {
			/** MessageName test4 */
			test4?: string | null;
		}

		/** Represents a MessageName. */
		class MessageName implements IMessageName {
			/**
			 * Constructs a new MessageName.
			 * @param [properties] Properties to set
			 */
			constructor(properties?: test.test22442_c.IMessageName);

			/** MessageName test4. */
			public test4: string;

			/**
			 * Creates a new MessageName instance using the specified properties.
			 * @param [properties] Properties to set
			 * @returns MessageName instance
			 */
			public static create(properties?: test.test22442_c.IMessageName): test.test22442_c.MessageName;

			/**
			 * Encodes the specified MessageName message. Does not implicitly {@link test.test22442_c.MessageName.verify|verify} messages.
			 * @param message MessageName message or plain object to encode
			 * @param [writer] Writer to encode to
			 * @returns Writer
			 */
			public static encode(message: test.test22442_c.IMessageName, writer?: $protobuf.Writer): $protobuf.Writer;

			/**
			 * Encodes the specified MessageName message, length delimited. Does not implicitly {@link test.test22442_c.MessageName.verify|verify} messages.
			 * @param message MessageName message or plain object to encode
			 * @param [writer] Writer to encode to
			 * @returns Writer
			 */
			public static encodeDelimited(message: test.test22442_c.IMessageName, writer?: $protobuf.Writer): $protobuf.Writer;

			/**
			 * Decodes a MessageName message from the specified reader or buffer.
			 * @param reader Reader or buffer to decode from
			 * @param [length] Message length if known beforehand
			 * @returns MessageName
			 * @throws {Error} If the payload is not a reader or valid buffer
			 * @throws {$protobuf.util.ProtocolError} If required fields are missing
			 */
			public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.test22442_c.MessageName;

			/**
			 * Decodes a MessageName message from the specified reader or buffer, length delimited.
			 * @param reader Reader or buffer to decode from
			 * @returns MessageName
			 * @throws {Error} If the payload is not a reader or valid buffer
			 * @throws {$protobuf.util.ProtocolError} If required fields are missing
			 */
			public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.test22442_c.MessageName;

			/**
			 * Verifies a MessageName message.
			 * @param message Plain object to verify
			 * @returns `null` if valid, otherwise the reason why it is not
			 */
			public static verify(message: { [k: string]: any }): string | null;

			/**
			 * Creates a MessageName message from a plain object. Also converts values to their respective internal types.
			 * @param object Plain object
			 * @returns MessageName
			 */
			public static fromObject(object: { [k: string]: any }): test.test22442_c.MessageName;

			/**
			 * Creates a plain object from a MessageName message. Also converts values to other types if specified.
			 * @param message MessageName
			 * @param [options] Conversion options
			 * @returns Plain object
			 */
			public static toObject(message: test.test22442_c.MessageName, options?: $protobuf.IConversionOptions): { [k: string]: any };

			/**
			 * Converts this MessageName to JSON.
			 * @returns JSON object
			 */
			public toJSON(): { [k: string]: any };

			/**
			 * Gets the default type url for MessageName
			 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
			 * @returns The default type url
			 */
			public static getTypeUrl(typeUrlPrefix?: string): string;
		}
	}

	/** Properties of a test2_c. */
	interface Itest2_c {
		/** test2_c __id */
		__id?: number | null;

		/** test2_c data */
		data?: string | null;
	}

	/** Represents a test2_c. */
	class test2_c implements Itest2_c {
		/**
		 * Constructs a new test2_c.
		 * @param [properties] Properties to set
		 */
		constructor(properties?: test.Itest2_c);

		/** test2_c __id. */
		public __id: number;

		/** test2_c data. */
		public data: string;

		/**
		 * Creates a new test2_c instance using the specified properties.
		 * @param [properties] Properties to set
		 * @returns test2_c instance
		 */
		public static create(properties?: test.Itest2_c): test.test2_c;

		/**
		 * Encodes the specified test2_c message. Does not implicitly {@link test.test2_c.verify|verify} messages.
		 * @param message test2_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encode(message: test.Itest2_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Encodes the specified test2_c message, length delimited. Does not implicitly {@link test.test2_c.verify|verify} messages.
		 * @param message test2_c message or plain object to encode
		 * @param [writer] Writer to encode to
		 * @returns Writer
		 */
		public static encodeDelimited(message: test.Itest2_c, writer?: $protobuf.Writer): $protobuf.Writer;

		/**
		 * Decodes a test2_c message from the specified reader or buffer.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Message length if known beforehand
		 * @returns test2_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.test2_c;

		/**
		 * Decodes a test2_c message from the specified reader or buffer, length delimited.
		 * @param reader Reader or buffer to decode from
		 * @returns test2_c
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {$protobuf.util.ProtocolError} If required fields are missing
		 */
		public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.test2_c;

		/**
		 * Verifies a test2_c message.
		 * @param message Plain object to verify
		 * @returns `null` if valid, otherwise the reason why it is not
		 */
		public static verify(message: { [k: string]: any }): string | null;

		/**
		 * Creates a test2_c message from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object
		 * @returns test2_c
		 */
		public static fromObject(object: { [k: string]: any }): test.test2_c;

		/**
		 * Creates a plain object from a test2_c message. Also converts values to other types if specified.
		 * @param message test2_c
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public static toObject(message: test.test2_c, options?: $protobuf.IConversionOptions): { [k: string]: any };

		/**
		 * Converts this test2_c to JSON.
		 * @returns JSON object
		 */
		public toJSON(): { [k: string]: any };

		/**
		 * Gets the default type url for test2_c
		 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
		 * @returns The default type url
		 */
		public static getTypeUrl(typeUrlPrefix?: string): string;
	}

	/** Namespace child. */
	namespace child {
		/** Properties of a test3. */
		interface Itest3 {
			/** test3 data */
			data?: string | null;
		}

		/** Represents a test3. */
		class test3 implements Itest3 {
			/**
			 * Constructs a new test3.
			 * @param [properties] Properties to set
			 */
			constructor(properties?: test.child.Itest3);

			/** test3 data. */
			public data: string;

			/**
			 * Creates a new test3 instance using the specified properties.
			 * @param [properties] Properties to set
			 * @returns test3 instance
			 */
			public static create(properties?: test.child.Itest3): test.child.test3;

			/**
			 * Encodes the specified test3 message. Does not implicitly {@link test.child.test3.verify|verify} messages.
			 * @param message test3 message or plain object to encode
			 * @param [writer] Writer to encode to
			 * @returns Writer
			 */
			public static encode(message: test.child.Itest3, writer?: $protobuf.Writer): $protobuf.Writer;

			/**
			 * Encodes the specified test3 message, length delimited. Does not implicitly {@link test.child.test3.verify|verify} messages.
			 * @param message test3 message or plain object to encode
			 * @param [writer] Writer to encode to
			 * @returns Writer
			 */
			public static encodeDelimited(message: test.child.Itest3, writer?: $protobuf.Writer): $protobuf.Writer;

			/**
			 * Decodes a test3 message from the specified reader or buffer.
			 * @param reader Reader or buffer to decode from
			 * @param [length] Message length if known beforehand
			 * @returns test3
			 * @throws {Error} If the payload is not a reader or valid buffer
			 * @throws {$protobuf.util.ProtocolError} If required fields are missing
			 */
			public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): test.child.test3;

			/**
			 * Decodes a test3 message from the specified reader or buffer, length delimited.
			 * @param reader Reader or buffer to decode from
			 * @returns test3
			 * @throws {Error} If the payload is not a reader or valid buffer
			 * @throws {$protobuf.util.ProtocolError} If required fields are missing
			 */
			public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): test.child.test3;

			/**
			 * Verifies a test3 message.
			 * @param message Plain object to verify
			 * @returns `null` if valid, otherwise the reason why it is not
			 */
			public static verify(message: { [k: string]: any }): string | null;

			/**
			 * Creates a test3 message from a plain object. Also converts values to their respective internal types.
			 * @param object Plain object
			 * @returns test3
			 */
			public static fromObject(object: { [k: string]: any }): test.child.test3;

			/**
			 * Creates a plain object from a test3 message. Also converts values to other types if specified.
			 * @param message test3
			 * @param [options] Conversion options
			 * @returns Plain object
			 */
			public static toObject(message: test.child.test3, options?: $protobuf.IConversionOptions): { [k: string]: any };

			/**
			 * Converts this test3 to JSON.
			 * @returns JSON object
			 */
			public toJSON(): { [k: string]: any };

			/**
			 * Gets the default type url for test3
			 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
			 * @returns The default type url
			 */
			public static getTypeUrl(typeUrlPrefix?: string): string;
		}
	}
}
