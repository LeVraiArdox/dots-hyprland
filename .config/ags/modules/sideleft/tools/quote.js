import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Box, Label } = Widget;
import SidebarModule from './module.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'

const MakeRequest = async () => {
    try {
        const response = await Utils.fetch("https://quotes-api-self.vercel.app/quote");
        const data = await response.json();
        return {
            quote: data.quote, 
            author: data.author
        };
    } catch (error) {
        console.error('Error fetching quote:', error);
        return { 
            quote: 'Unable to fetch quote', 
            author: 'Unknown' 
        };
    }
};

export default () => {
    const quoteLabel = Label({
        wrap: true,
        hpack: 'center',
        className: 'txt txt-quote',
        label: 'Loading...'
    });

    const authorLabel = Label({
        hpack: 'center',
        className: 'txt txt-small',
        label: 'Loading...'
    });

    // Immediately invoke async function to update labels
    (async () => {
        const { quote, author } = await MakeRequest();
        quoteLabel.label = quote;
        authorLabel.label = author;
        console.log('Quote:', quote);
        console.log('Author:', author);
    })();

    return SidebarModule({
        icon: MaterialIcon('format_quote', 'norm'),
        name: 'Quotes',
        child: Box({
            vertical: true,
            hexpand: true,
            className: 'spacing-v-5',
            children: [
                quoteLabel,
                authorLabel
            ]
        })
    });
};