import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

<% if (where === 'client') { -%>
export const <%= name %> = new Mongo.Collection(null);
<% } else { -%>
class <%= name %>Collection extends Mongo.Collection {
  constructor() {
    super('<%= name %>');

    this.publicFields = {};
    this.privateFields = {};
    this.deny({
      insert() { return true; },
      update() { return true; },
      remove() { return true; },
    });

    this.schema = {};
  }

  /**
   * @public
   * @param { object } doc The document to inserted.
   * @param { object } callback The callback from invocation.
   * @returns { string } The _id of the new doc.
   */
  insert(doc, callback) {
    if (this._hasSchema()) {
      check(doc, this.schema);
    }

    const result = super.insert(doc, callback);
    return result;
  }

  /**
   * @public
   * @param { object | string } selector The mongodb selector.
   * @param { object } modifier The mongodb modifier.
   * @returns { string } The _id of the document updated.
   * */
  update(selector, modifier) {
    if (this._hasSchema()) {
      check(modifier.$set, this.schema);
    }
    
    const result = super.update(selector, modifier);
    return result;
  }

  /**
   * @public
   * @param { object | string } selector The mongodb selector.
   * @returns { string } The _id of the document being removed.
   */
  remove(selector) {
    const result = super.remove(selector);
    return result;
  }

  // Helper method
  _hasSchema = () => {
    const { schema } = this;
    if (schema) {
      return (Object.keys(schema).length !== 0 
              && schema.constructor === Object);
    }
  }
}
const <%= name %> = new <%= name %>Collection();
export default  <%= name %>;

<% } %>
