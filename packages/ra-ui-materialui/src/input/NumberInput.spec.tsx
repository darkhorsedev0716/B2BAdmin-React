import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NumberInput } from './NumberInput';
import { AdminContext } from '../AdminContext';
import { SaveButton } from '../button';
import { SimpleForm, Toolbar } from '../form';
import { useFormContext, useWatch } from 'react-hook-form';

describe('<NumberInput />', () => {
    const defaultProps = {
        source: 'views',
        resource: 'posts',
    };

    const MyToolbar = () => (
        <Toolbar>
            <SaveButton alwaysEnable />
        </Toolbar>
    );

    const RecordWatcher = () => {
        const views = useWatch({ name: 'views' });
        return <code>views:{JSON.stringify(views)}</code>;
    };

    it('should use a mui TextField', () => {
        render(
            <AdminContext>
                <SimpleForm defaultValues={{ views: 12 }} onSubmit={jest.fn()}>
                    <NumberInput {...defaultProps} />
                </SimpleForm>
            </AdminContext>
        );
        const input = screen.getByLabelText(
            'resources.posts.fields.views'
        ) as HTMLInputElement;
        expect(input.value).toEqual('12');
        expect(input.getAttribute('type')).toEqual('number');
    });

    it('should accept `step` prop and pass it to native input', () => {
        render(
            <AdminContext>
                <SimpleForm onSubmit={jest.fn()}>
                    <NumberInput {...defaultProps} step="0.1" />
                </SimpleForm>
            </AdminContext>
        );
        const input = screen.getByLabelText(
            'resources.posts.fields.views'
        ) as HTMLInputElement;
        expect(input.step).toEqual('0.1');
    });

    it('should change when the user types a number and blurs', () => {
        render(
            <AdminContext>
                <SimpleForm defaultValues={{ views: 12 }} onSubmit={jest.fn()}>
                    <NumberInput {...defaultProps} />
                    <RecordWatcher />
                </SimpleForm>
            </AdminContext>
        );
        screen.getByText('views:12');
        const input = screen.getByLabelText(
            'resources.posts.fields.views'
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.blur(input);
        screen.getByText('views:3');
    });

    it('should change when the user types a number and presses enter', () => {
        render(
            <AdminContext>
                <SimpleForm defaultValues={{ views: 12 }} onSubmit={jest.fn()}>
                    <NumberInput {...defaultProps} />
                    <RecordWatcher />
                </SimpleForm>
            </AdminContext>
        );
        screen.getByText('views:12');
        const input = screen.getByLabelText(
            'resources.posts.fields.views'
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.keyUp(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
        screen.getByText('views:3');
    });

    it('should reinitialize when form values change', () => {
        const UpdateViewsButton = () => {
            const { setValue } = useFormContext();
            return (
                <button onClick={() => setValue('views', 45)}>
                    Update views
                </button>
            );
        };
        render(
            <AdminContext>
                <SimpleForm defaultValues={{ views: 12 }} onSubmit={jest.fn()}>
                    <NumberInput {...defaultProps} />
                    <UpdateViewsButton />
                    <RecordWatcher />
                </SimpleForm>
            </AdminContext>
        );
        screen.getByText('views:12');
        fireEvent.click(screen.getByText('Update views'));
        screen.getByText('views:45');
    });

    describe('field state', () => {
        const FieldState = ({ name = 'views' }) => {
            const formContext = useFormContext();
            return (
                <code>
                    {name}:{JSON.stringify(formContext.getFieldState(name))}
                </code>
            );
        };
        it('should return correct state when the field is pristine', () => {
            render(
                <AdminContext>
                    <SimpleForm>
                        <NumberInput {...defaultProps} />
                        <FieldState />
                    </SimpleForm>
                </AdminContext>
            );
            screen.getByText(
                'views:{"invalid":false,"isDirty":false,"isTouched":false}'
            );
        });
        it('should return correct state when the field is touched', () => {
            render(
                <AdminContext>
                    <SimpleForm>
                        <NumberInput {...defaultProps} />
                        <FieldState />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText(
                'resources.posts.fields.views'
            ) as HTMLInputElement;
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);
            screen.getByText(
                'views:{"invalid":false,"isDirty":true,"isTouched":true}'
            );
        });
        it('should return correct state when the field is invalid', async () => {
            render(
                <AdminContext>
                    <SimpleForm>
                        <NumberInput
                            {...defaultProps}
                            validate={() => 'error'}
                        />
                        <FieldState />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText(
                'resources.posts.fields.views'
            ) as HTMLInputElement;
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);
            fireEvent.click(screen.getByText('ra.action.save'));
            await screen.findByText(
                'views:{"invalid":true,"isDirty":true,"isTouched":true,"error":{"type":"validate","message":"error","ref":{}}}'
            );
        });
    });

    describe('format and parse', () => {
        it('should get the same value as injected value ', async () => {
            const onSubmit = jest.fn();

            render(
                <AdminContext>
                    <SimpleForm
                        toolbar={<MyToolbar />}
                        defaultValues={{ views: 12 }}
                        onSubmit={onSubmit}
                    >
                        <NumberInput {...defaultProps} />
                    </SimpleForm>
                </AdminContext>
            );
            fireEvent.click(screen.getByText('ra.action.save'));
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith({ views: 12 });
            });
            expect(typeof onSubmit.mock.calls[0][0].views).toEqual('number');
        });

        it('should return null when no defaultValue', async () => {
            const onSubmit = jest.fn();
            render(
                <AdminContext>
                    <SimpleForm toolbar={<MyToolbar />} onSubmit={onSubmit}>
                        <NumberInput {...defaultProps} />
                    </SimpleForm>
                </AdminContext>
            );
            fireEvent.click(screen.getByText('ra.action.save'));
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith({ views: null });
            });
            expect(onSubmit.mock.calls[0][0].views).toBeNull();
        });

        it('should cast value to numeric', async () => {
            const onSubmit = jest.fn();

            render(
                <AdminContext>
                    <SimpleForm
                        defaultValues={{ views: 12 }}
                        onSubmit={onSubmit}
                    >
                        <NumberInput {...defaultProps} />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);
            fireEvent.click(screen.getByText('ra.action.save'));
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith({ views: 3 });
            });
            expect(typeof onSubmit.mock.calls[0][0].views).toEqual('number');
        });

        it('should cast empty value to null', async () => {
            const onSubmit = jest.fn();

            render(
                <AdminContext>
                    <SimpleForm
                        defaultValues={{ views: 12 }}
                        onSubmit={onSubmit}
                    >
                        <NumberInput {...defaultProps} />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            fireEvent.click(screen.getByText('ra.action.save'));
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith({ views: null });
            });
            expect(onSubmit.mock.calls[0][0].views).toBeNull();
        });
    });

    describe('onChange event', () => {
        it('should be customizable via the `onChange` prop', async () => {
            let value;
            const onChange = jest.fn(event => {
                value = event.target.value;
            });

            render(
                <AdminContext>
                    <SimpleForm
                        defaultValues={{ views: 12 }}
                        onSubmit={jest.fn()}
                    >
                        <NumberInput {...defaultProps} onChange={onChange} />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);
            await waitFor(() => {
                expect(value).toEqual('3');
            });
        });

        it('should keep calling the form library original event', async () => {
            const onSubmit = jest.fn();
            let value;
            const onChange = jest.fn(event => {
                value = event.target.value;
            });
            render(
                <AdminContext>
                    <SimpleForm
                        defaultValues={{ views: 12 }}
                        onSubmit={onSubmit}
                    >
                        <NumberInput {...defaultProps} onChange={onChange} />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);
            expect(value).toEqual('3');
            fireEvent.click(screen.getByText('ra.action.save'));
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith({ views: 3 });
            });
        });
    });

    describe('onFocus event', () => {
        it('should be customizable via the `onFocus` prop', () => {
            const onFocus = jest.fn();

            render(
                <AdminContext>
                    <SimpleForm
                        defaultValues={{ views: 12 }}
                        onSubmit={jest.fn()}
                    >
                        <NumberInput {...defaultProps} onFocus={onFocus} />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.focus(input);
            expect(onFocus).toHaveBeenCalled();
        });
    });

    describe('onBlur event', () => {
        it('should be customizable via the `onBlur` prop', () => {
            const onBlur = jest.fn();

            render(
                <AdminContext>
                    <SimpleForm
                        defaultValues={{ views: 12 }}
                        onSubmit={jest.fn()}
                    >
                        <NumberInput {...defaultProps} onBlur={onBlur} />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.blur(input);
            expect(onBlur).toHaveBeenCalled();
        });
    });

    describe('error message', () => {
        it('should not be displayed if field is pristine', () => {
            render(
                <AdminContext>
                    <SimpleForm
                        toolbar={<MyToolbar />}
                        defaultValues={{ views: 12 }}
                        onSubmit={jest.fn()}
                    >
                        <NumberInput
                            {...defaultProps}
                            validate={() => 'error'}
                        />
                    </SimpleForm>
                </AdminContext>
            );
            fireEvent.click(screen.getByText('ra.action.save'));
            const error = screen.queryByText('error');
            expect(error).toBeNull();
        });

        it('should not be displayed if field has been touched but is valid', () => {
            render(
                <AdminContext>
                    <SimpleForm
                        toolbar={<MyToolbar />}
                        defaultValues={{ views: 12 }}
                        onSubmit={jest.fn()}
                    >
                        <NumberInput
                            {...defaultProps}
                            validate={value => undefined}
                        />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);

            fireEvent.click(screen.getByText('ra.action.save'));

            const error = screen.queryByText('error');
            expect(error).toBeNull();
        });

        it('should be displayed if field has been touched and is invalid', async () => {
            render(
                <AdminContext>
                    <SimpleForm
                        toolbar={<MyToolbar />}
                        defaultValues={{ views: 12 }}
                        onSubmit={jest.fn()}
                    >
                        <NumberInput
                            {...defaultProps}
                            validate={() => 'error'}
                        />
                    </SimpleForm>
                </AdminContext>
            );
            const input = screen.getByLabelText('resources.posts.fields.views');
            fireEvent.change(input, { target: { value: '3' } });
            fireEvent.blur(input);

            fireEvent.click(screen.getByText('ra.action.save'));

            await waitFor(() => {
                expect(screen.getByText('error')).not.toBeNull();
            });
        });
    });
});
