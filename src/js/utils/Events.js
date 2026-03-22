export default class Events
{
    constructor()
    {
        this.callbacks = {}
    }

    on(_name, _callback, _order = 1)
    {
        // Create callbacks array if needed
        if(!(this.callbacks[_name] instanceof Array))
        {
            this.callbacks[_name] = [];
        }

        // Create order array if needed
        if(!(this.callbacks[_name][_order] instanceof Array))
        {
            this.callbacks[_name][_order] =[];
        }

        // Save callback
        this.callbacks[_name][_order].push(_callback);

        return this;
    }

    off(_name, _callback = null)
    {
        const callbacks = this.callbacks[_name];

        if(!(callbacks instanceof Array))
        {
            return this;
        }

        // Remove specific
        if(typeof _callback === 'function')
        {
            for(const order in callbacks)
            {
                const orderedCallbacks = callbacks[order];

                if(!(orderedCallbacks instanceof Array))
                {
                    continue;
                }

                const index = orderedCallbacks.indexOf(_callback);

                if(index !== -1)
                {
                    orderedCallbacks.splice(index, 1);
                }

                if(orderedCallbacks.length === 0)
                {
                    delete callbacks[order];
                }
            }

            if(callbacks.every((orderedCallbacks) => orderedCallbacks === undefined))
            {
                delete this.callbacks[_name];
            }
        }

        // Remove all
        else
        {
            delete this.callbacks[_name];
        }

        return this;
    }

    trigger(_name, _arguments = [])
    {
        if(this.callbacks[_name] instanceof Array)
        {
            for(const order in this.callbacks[_name])
            {
                for(const _callbackFunction of this.callbacks[_name][order])
                {
                    _callbackFunction.apply(this, _arguments);
                }
            }
        }

        return this;
    }
}
