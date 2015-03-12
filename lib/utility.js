var _ = require('lodash'),
	MongoDB = require('mongodb'),
	ObjectID = MongoDB.ObjectID;

module.exports = function (Arrow, server) {

	return {

		/**
		 * build a primary key query
		 */
		createPrimaryKeyQuery: function createPrimaryKeyQuery(id) {
			try {
				return { _id: ObjectID(id) };
			}
			catch (err) {
				return null;
			}
		},

		/**
		 * return the collection based on the Model name or configured from metadata
		 */
		getCollection: function getCollection(Model) {
			var name = Model.getMeta('collection') || Model.name,
				collection = this.db.collection(name, name);
			if (!collection) {
				throw new ORMError("no collection found with model named:" + name);
			}
			return collection;
		},

		/**
		 * return a new instance from a Mongo query result
		 */
		createInstanceFromResult: function createInstanceFromResult(Model, result) {
			var instance = Model.instance(result, true);
			instance.setPrimaryKey(String(result._id));
			return instance;
		},

		/**
		 * Calculates the parameters for a query based on the provided options.
		 * @param options
		 * @returns {{fields: {}, where: (options.where|*|{})}}
		 */
		calculateQueryParams: function calculateQueryParams(options) {
			var fields = {},
				where = options.where || {};

			if (options.sel) {
				Object.keys(options.sel).forEach(function (key) {
					fields[key] = true;
				});
			}
			if (options.unsel) {
				Object.keys(options.unsel).forEach(function (key) {
					fields[key] = false;
				});
			}

			var order = options.order;
			if (order) {
				for (var orderKey in order) {
					if (order.hasOwnProperty(orderKey)) {
						if (typeof order[orderKey] === 'string') {
							order[orderKey] = parseInt(order[orderKey], 10);
						}
					}
				}
			}

			if (Object.keys(where).length === 1 && where.id) {
				where = this.createPrimaryKeyQuery(where.id);
			}

			options.where = where;
			options.fields = fields;
			return options;
		},

		/**
		 * Common function to call Model#translateKeysForPayload for various
		 * fields in options.
		 *
		 * @param Model
		 * @param options
		 */
		translateQueryKeys: function translateQueryKeys(Model, options) {
			options.sel = Model.translateKeysForPayload(options.sel);
			options.unsel = Model.translateKeysForPayload(options.unsel);
			options.where = _.pick(Model.translateKeysForPayload(options.where), Model.payloadKeys().concat(['id']));
			options.order = Model.translateKeysForPayload(options.order);

			return options;
		}

	};
};