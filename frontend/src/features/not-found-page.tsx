import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/data/page';
import { useDocumentTitle } from '@/hooks/use-document-title';

const NotFoundPage = ({ standalone = false }: { standalone?: boolean }) => {
    useDocumentTitle('Page not found');
    const content = (
        <EmptyState
            icon={Compass}
            title="Page not found"
            description="The page you're looking for doesn't exist or has moved."
            action={<Button asChild><Link to="/admin">Back to the app</Link></Button>}
        />
    );
    return standalone ? <div className="grid min-h-dvh place-items-center">{content}</div> : content;
};

export default NotFoundPage;
